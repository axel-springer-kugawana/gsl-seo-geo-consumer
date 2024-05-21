data "aws_subnets" "application_data_subnets" {
  filter {
    name = "tag:Name"
    # values = ["${var.aws_account_name}-application*"]
    values = ["main*"]

  }
}

data "aws_ami" "amazon-linux-2" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_iam_role" "port-forwarding" {
  name               = "ec2-ssm-role"
  description        = "The role for the developer resources EC2"
  assume_role_policy = <<EOF
{
"Version": "2012-10-17",
"Statement": {
"Effect": "Allow",
"Principal": {"Service": "ec2.amazonaws.com"},
"Action": "sts:AssumeRole"
}
}
EOF
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.port-forwarding.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "port-forwarding" {
  name = "ec2_profile${var.suffix}"
  role = aws_iam_role.port-forwarding.name
}

data "aws_kms_key" "ebs" {
  key_id = "alias/aws/ebs"
}

data "aws_iam_policy_document" "ec2_kms" {

  statement {
    sid = "AllowSSMToDecryptWithKMS"

    actions = [
      "kms:Decrypt"
    ]

    resources = [
      "${data.aws_kms_key.ebs.arn}"
    ]
  }
}

resource "aws_iam_policy" "ec2_kms" {
  name   = "ec2_kms${var.suffix}"
  policy = data.aws_iam_policy_document.ec2_kms.json
}

resource "aws_iam_role_policy_attachment" "kms" {
  role       = aws_iam_role.port-forwarding.name
  policy_arn = aws_iam_policy.ec2_kms.arn
}

resource "aws_security_group" "allow_ssm" {
  name        = "allow_ec2_ssm${var.suffix}"
  description = "allow ssm traffic from ec2"
  vpc_id      = data.aws_ec2_managed_prefix_list.vpn_access_prefix_list_cloudflare.id #data.aws_vpc.foundation_vpc.id

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_instance" "port-forwarding" {
  ami                    = data.aws_ami.amazon-linux-2.id
  instance_type          = "t3.nano"
  subnet_id              = data.aws_subnets.application_data_subnets.ids[0]
  iam_instance_profile   = aws_iam_instance_profile.port-forwarding.name
  vpc_security_group_ids = [aws_security_group.allow_ssm.id]
  user_data              = <<EOF
#!/bin/bash
sudo yum install -y socat
sudo nohup socat TCP-LISTEN:${module.rds.rds_cluster_port},reuseaddr,fork TCP4:${module.rds.rds_cluster_writer_endpoint}:${module.rds.rds_cluster_port} &
EOF
  root_block_device {
    volume_size           = "8"
    volume_type           = "gp2"
    encrypted             = true
    delete_on_termination = true
  }
  tags = {
    Name = "bastion${var.suffix}"
  }
}
