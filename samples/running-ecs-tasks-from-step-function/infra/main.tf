
module "job_runner" {
    source = "./modules/sfn-ecs-task-job-runner"
    application = "sfn-ecs-task-runner"
    environment = "sandbox"
    container_image = "hello-world"
}
