resource "aws_ecr_repository" "geo_bulk_load" {
  name                 = local.name
  # image_tag_mutability = "MUTABLE"
  # force_delete         = true

  # image_scanning_configuration {
  #   scan_on_push = true
  # }
}

resource "aws_ecr_lifecycle_policy" "geo_bulk_load" {
  repository = aws_ecr_repository.geo_bulk_load.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep the last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}

data "aws_ecr_image" "geo_bulk_load_most_recent" {
  count           = var.image_tag == "" ? 1 : 0
  repository_name = aws_ecr_repository.geo_bulk_load.name
  most_recent     = true
}

locals {
  selected_image_tag = var.image_tag != "" ? var.image_tag : data.aws_ecr_image.geo_bulk_load_most_recent[0].image_tags[0]
}

resource "aws_ecs_cluster" "geo_bulk_load" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "geo_bulk_load" {
  cluster_name       = aws_ecs_cluster.geo_bulk_load.name
  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

resource "aws_cloudwatch_log_group" "geo_bulk_load" {
  name              = "/aws/ecs/${local.name}"
  retention_in_days = var.cloudwatch_log_retention
}

resource "aws_secretsmanager_secret" "geo_bulk_load" {
  name                    = "${local.name}-credentials"
  recovery_window_in_days = 0
}

resource "aws_security_group" "task" {
  name        = "${local.name}-sg"
  description = "${local.name} task egress"
  vpc_id      = data.aws_ssm_parameter.vpc_id.value
}

resource "aws_security_group_rule" "task_https_egress" {
  type              = "egress"
  description       = "s3, secrets manager and ecr"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = aws_security_group.task.id
}

resource "aws_security_group_rule" "task_postgres_egress" {
  type              = "egress"
  description       = "Postgre TCP egress"
  from_port         = data.aws_rds_cluster.ssot.port
  to_port           = data.aws_rds_cluster.ssot.port
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  ipv6_cidr_blocks  = ["::/0"]
  security_group_id = aws_security_group.task.id
}

# The cluster security group is not managed by this repository, so the inbound
# side of the path is only opened when its id is given, and as an added rule
# rather than as a replacement of the group.
resource "aws_security_group_rule" "database_ingress_from_task" {
  count                    = var.rds.security_group_id == "" ? 0 : 1
  type                     = "ingress"
  description              = "${local.name} bulk load"
  from_port                = data.aws_rds_cluster.ssot.port
  to_port                  = data.aws_rds_cluster.ssot.port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.task.id
  security_group_id        = var.rds.security_group_id
}

resource "aws_ecs_task_definition" "geo_bulk_load" {
  family                   = local.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  ephemeral_storage {
    size_in_gib = var.ephemeral_storage_gib
  }

  container_definitions = jsonencode([
    {
      name      = "geo-bulk-load"
      image     = "${aws_ecr_repository.geo_bulk_load.repository_url}:${local.selected_image_tag}"
      essential = true
      environment = [
        { name = "GEO_DB_SECRET_ID", value = aws_secretsmanager_secret.geo_bulk_load.name },
        { name = "DUCKDB_EXTENSION_DIRECTORY", value = "/opt/duckdb/extensions" },
        { name = "GEO_MANAGEMENT_SYNC_BUCKET", value = var.geo_management_sync_bucket },
        { name = "GEO_MANAGEMENT_BUCKET_KEY", value = var.geo_management_bucket_key },
        { name = "DUCKDB_MEMORY_LIMIT", value = var.duckdb_memory_limit },
        { name = "DUCKDB_TEMP_DIRECTORY", value = "/tmp/duckdb_spill" },
        { name = "GEO_DYNAMODB_TABLE_NAME", value = var.geo_dynamodb_table.name },
        { name = "GEO_LINEAGE_DYNAMODB_TABLE_NAME", value = var.geo_lineage_dynamodb_table.name },
        { name = "GEO_DYNAMODB_SCHEMA_VERSION", value = var.geo_dynamodb_schema_version },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.geo_bulk_load.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "task"
        }
      }
    }
  ])
}
