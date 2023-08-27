module "classified_events_producers" {

    source = "./modules/classified-events-producers"
    classified_created_events_producer = {
        lambda_dist_dir = "../src/dist/classified-events-producers/lambda-handlers"
        lambda_handler_name = "classified-created-events-producer.handler"
    }

    classified_censored_events_producer = {
        lambda_dist_dir = "../src/dist/classified-events-producers/lambda-handlers"
        lambda_handler_name = "classified-censored-events-producer.handler"
    }

    application = "event-standards"
    environment = "sandbox"
}


module "classified_events_consumers" {

    source = "./modules/classified-events-consumers"
    classified_created_events_consumer = {
        lambda_dist_dir = "../src/dist/classified-events-consumers/lambda-handlers"
        lambda_handler_name = "classified-created-events-consumer.handler"
    }

    classified_censored_events_consumer = {
        lambda_dist_dir = "../src/dist/classified-events-consumers/lambda-handlers"
        lambda_handler_name = "classified-censored-events-consumer.handler"
    }

    classified_events_topic_arn = module.classified_events_producers.classified_events_topic_arn

    application = "event-standards"
    environment = "sandbox"
}