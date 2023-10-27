export const schema={
  "asyncapi": "2.6.0",
  "info": {
    "title": "SSOT Stream API",
    "version": "1.0.0"
  },
  "channels": {
    "ssot-events": {
      "subscribe": {
        "message": {
          "oneOf": [
            {
              "payload": {
                "type": "object",
                "additionalProperties": false,
                "allOf": [
                  {
                    "type": "object",
                    "allOf": [
                      {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "description": "CloudEvents Specification JSON Schema",
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "source": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversion": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "type": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttype": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschema": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subject": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "time": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "data": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "required": [
                          "id",
                          "source",
                          "specversion",
                          "type"
                        ],
                        "definitions": {
                          "iddef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "sourcedef": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversiondef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "typedef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttypedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschemadef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subjectdef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "timedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "datadef": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64def": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "x-parser-schema-id": "<anonymous-schema-11>"
                      }
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-9>"
                      },
                      "idempotencykey": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-10>"
                      }
                    },
                    "x-parser-schema-id": "EventEnvelope"
                  }
                ],
                "properties": {
                  "data": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-1>"
                      },
                      "version": {
                        "type": "number",
                        "x-parser-schema-id": "<anonymous-schema-2>"
                      },
                      "modelVersion": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-3>"
                      },
                      "updateDate": {
                        "type": "number",
                        "x-parser-schema-id": "<anonymous-schema-4>"
                      },
                      "property1": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-5>"
                      },
                      "property2": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-6>"
                      },
                      "property3": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-7>"
                      }
                    },
                    "x-parser-schema-id": "SSoTEntityStateEventData"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "classified-created.v1"
                    ],
                    "x-parser-schema-id": "SSoTEntityCreatedV1EventType"
                  },
                  "subject": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-8>"
                  }
                },
                "required": [
                  "data",
                  "type"
                ],
                "x-parser-schema-id": "SSoTEntityCreatedEvent"
              },
              "x-parser-message-name": "SSoTEntityCreated"
            },
            {
              "payload": {
                "type": "object",
                "additionalProperties": false,
                "allOf": [
                  {
                    "type": "object",
                    "allOf": [
                      {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "description": "CloudEvents Specification JSON Schema",
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "source": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversion": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "type": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttype": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschema": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subject": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "time": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "data": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "required": [
                          "id",
                          "source",
                          "specversion",
                          "type"
                        ],
                        "definitions": {
                          "iddef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "sourcedef": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversiondef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "typedef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttypedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschemadef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subjectdef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "timedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "datadef": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64def": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "x-parser-schema-id": "<anonymous-schema-11>"
                      }
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-9>"
                      },
                      "idempotencykey": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-10>"
                      }
                    },
                    "x-parser-schema-id": "EventEnvelope"
                  }
                ],
                "properties": {
                  "data": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-1>"
                      },
                      "version": {
                        "type": "number",
                        "x-parser-schema-id": "<anonymous-schema-2>"
                      },
                      "modelVersion": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-3>"
                      },
                      "updateDate": {
                        "type": "number",
                        "x-parser-schema-id": "<anonymous-schema-4>"
                      },
                      "property1": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-5>"
                      },
                      "property2": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-6>"
                      },
                      "property3": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-7>"
                      }
                    },
                    "x-parser-schema-id": "SSoTEntityStateEventData"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "classified-updated.v1"
                    ],
                    "x-parser-schema-id": "SSoTEntityUpdatedV1EventType"
                  },
                  "subject": {
                    "type": "string",
                    "x-parser-schema-id": "<anonymous-schema-22>"
                  }
                },
                "required": [
                  "data",
                  "type"
                ],
                "x-parser-schema-id": "SSoTEntityUpdatedEvent"
              },
              "x-parser-message-name": "SSoTEntityUpdated"
            },
            {
              "payload": {
                "type": "object",
                "additionalProperties": false,
                "allOf": [
                  {
                    "type": "object",
                    "allOf": [
                      {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "description": "CloudEvents Specification JSON Schema",
                        "type": "object",
                        "properties": {
                          "id": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "source": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversion": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "type": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttype": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschema": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subject": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "time": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "data": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "required": [
                          "id",
                          "source",
                          "specversion",
                          "type"
                        ],
                        "definitions": {
                          "iddef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-12>"
                          },
                          "sourcedef": {
                            "type": "string",
                            "format": "uri-reference",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-13>"
                          },
                          "specversiondef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-14>"
                          },
                          "typedef": {
                            "type": "string",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-15>"
                          },
                          "datacontenttypedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-16>"
                          },
                          "dataschemadef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "uri",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-17>"
                          },
                          "subjectdef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-18>"
                          },
                          "timedef": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "format": "date-time",
                            "minLength": 1,
                            "x-parser-schema-id": "<anonymous-schema-19>"
                          },
                          "datadef": {
                            "type": [
                              "object",
                              "string",
                              "number",
                              "array",
                              "boolean",
                              "null"
                            ],
                            "x-parser-schema-id": "<anonymous-schema-20>"
                          },
                          "data_base64def": {
                            "type": [
                              "string",
                              "null"
                            ],
                            "contentEncoding": "base64",
                            "x-parser-schema-id": "<anonymous-schema-21>"
                          }
                        },
                        "x-parser-schema-id": "<anonymous-schema-11>"
                      }
                    ],
                    "properties": {
                      "id": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-9>"
                      },
                      "idempotencykey": {
                        "type": "string",
                        "format": "uuid",
                        "x-parser-schema-id": "<anonymous-schema-10>"
                      }
                    },
                    "x-parser-schema-id": "EventEnvelope"
                  }
                ],
                "properties": {
                  "data": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string",
                        "x-parser-schema-id": "<anonymous-schema-23>"
                      }
                    },
                    "x-parser-schema-id": "SSoTEntityDeletedEventData"
                  },
                  "type": {
                    "type": "string",
                    "enum": [
                      "classified-deleted.v1"
                    ],
                    "x-parser-schema-id": "SSoTEntityDeletedV1EventType"
                  }
                },
                "required": [
                  "data",
                  "type"
                ],
                "x-parser-schema-id": "SSoTEntityDeletedEvent"
              },
              "x-parser-message-name": "SSoTEntityDeleted"
            }
          ]
        }
      }
    }
  },
  "components": {
    "messages": {
      "SSoTEntityUpdated": {
        "payload": {
          "type": "object",
          "additionalProperties": false,
          "allOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$schema": "http://json-schema.org/draft-07/schema#",
                  "description": "CloudEvents Specification JSON Schema",
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "source": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversion": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "type": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttype": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschema": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subject": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "time": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "data": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "required": [
                    "id",
                    "source",
                    "specversion",
                    "type"
                  ],
                  "definitions": {
                    "iddef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "sourcedef": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversiondef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "typedef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttypedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschemadef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subjectdef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "timedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "datadef": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64def": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "x-parser-schema-id": "<anonymous-schema-11>"
                }
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-9>"
                },
                "idempotencykey": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-10>"
                }
              },
              "x-parser-schema-id": "EventEnvelope"
            }
          ],
          "properties": {
            "data": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-1>"
                },
                "version": {
                  "type": "number",
                  "x-parser-schema-id": "<anonymous-schema-2>"
                },
                "modelVersion": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-3>"
                },
                "updateDate": {
                  "type": "number",
                  "x-parser-schema-id": "<anonymous-schema-4>"
                },
                "property1": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-5>"
                },
                "property2": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-6>"
                },
                "property3": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-7>"
                }
              },
              "x-parser-schema-id": "SSoTEntityStateEventData"
            },
            "type": {
              "type": "string",
              "enum": [
                "classified-updated.v1"
              ],
              "x-parser-schema-id": "SSoTEntityUpdatedV1EventType"
            },
            "subject": {
              "type": "string",
              "x-parser-schema-id": "<anonymous-schema-22>"
            }
          },
          "required": [
            "data",
            "type"
          ],
          "x-parser-schema-id": "SSoTEntityUpdatedEvent"
        },
        "x-parser-message-name": "SSoTEntityUpdated"
      },
      "SSoTEntityDeleted": {
        "payload": {
          "type": "object",
          "additionalProperties": false,
          "allOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$schema": "http://json-schema.org/draft-07/schema#",
                  "description": "CloudEvents Specification JSON Schema",
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "source": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversion": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "type": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttype": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschema": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subject": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "time": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "data": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "required": [
                    "id",
                    "source",
                    "specversion",
                    "type"
                  ],
                  "definitions": {
                    "iddef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "sourcedef": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversiondef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "typedef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttypedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschemadef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subjectdef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "timedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "datadef": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64def": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "x-parser-schema-id": "<anonymous-schema-11>"
                }
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-9>"
                },
                "idempotencykey": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-10>"
                }
              },
              "x-parser-schema-id": "EventEnvelope"
            }
          ],
          "properties": {
            "data": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-23>"
                }
              },
              "x-parser-schema-id": "SSoTEntityDeletedEventData"
            },
            "type": {
              "type": "string",
              "enum": [
                "classified-deleted.v1"
              ],
              "x-parser-schema-id": "SSoTEntityDeletedV1EventType"
            }
          },
          "required": [
            "data",
            "type"
          ],
          "x-parser-schema-id": "SSoTEntityDeletedEvent"
        },
        "x-parser-message-name": "SSoTEntityDeleted"
      },
      "SSoTEntityCreated": {
        "payload": {
          "type": "object",
          "additionalProperties": false,
          "allOf": [
            {
              "type": "object",
              "allOf": [
                {
                  "$schema": "http://json-schema.org/draft-07/schema#",
                  "description": "CloudEvents Specification JSON Schema",
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "source": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversion": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "type": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttype": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschema": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subject": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "time": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "data": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "required": [
                    "id",
                    "source",
                    "specversion",
                    "type"
                  ],
                  "definitions": {
                    "iddef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-12>"
                    },
                    "sourcedef": {
                      "type": "string",
                      "format": "uri-reference",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-13>"
                    },
                    "specversiondef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-14>"
                    },
                    "typedef": {
                      "type": "string",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-15>"
                    },
                    "datacontenttypedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-16>"
                    },
                    "dataschemadef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "uri",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-17>"
                    },
                    "subjectdef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-18>"
                    },
                    "timedef": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "format": "date-time",
                      "minLength": 1,
                      "x-parser-schema-id": "<anonymous-schema-19>"
                    },
                    "datadef": {
                      "type": [
                        "object",
                        "string",
                        "number",
                        "array",
                        "boolean",
                        "null"
                      ],
                      "x-parser-schema-id": "<anonymous-schema-20>"
                    },
                    "data_base64def": {
                      "type": [
                        "string",
                        "null"
                      ],
                      "contentEncoding": "base64",
                      "x-parser-schema-id": "<anonymous-schema-21>"
                    }
                  },
                  "x-parser-schema-id": "<anonymous-schema-11>"
                }
              ],
              "properties": {
                "id": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-9>"
                },
                "idempotencykey": {
                  "type": "string",
                  "format": "uuid",
                  "x-parser-schema-id": "<anonymous-schema-10>"
                }
              },
              "x-parser-schema-id": "EventEnvelope"
            }
          ],
          "properties": {
            "data": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-1>"
                },
                "version": {
                  "type": "number",
                  "x-parser-schema-id": "<anonymous-schema-2>"
                },
                "modelVersion": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-3>"
                },
                "updateDate": {
                  "type": "number",
                  "x-parser-schema-id": "<anonymous-schema-4>"
                },
                "property1": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-5>"
                },
                "property2": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-6>"
                },
                "property3": {
                  "type": "string",
                  "x-parser-schema-id": "<anonymous-schema-7>"
                }
              },
              "x-parser-schema-id": "SSoTEntityStateEventData"
            },
            "type": {
              "type": "string",
              "enum": [
                "classified-created.v1"
              ],
              "x-parser-schema-id": "SSoTEntityCreatedV1EventType"
            },
            "subject": {
              "type": "string",
              "x-parser-schema-id": "<anonymous-schema-8>"
            }
          },
          "required": [
            "data",
            "type"
          ],
          "x-parser-schema-id": "SSoTEntityCreatedEvent"
        },
        "x-parser-message-name": "SSoTEntityCreated"
      }
    },
    "schemas": {
      "SSoTEntityDeletedEvent": {
        "type": "object",
        "additionalProperties": false,
        "allOf": [
          {
            "type": "object",
            "allOf": [
              {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "description": "CloudEvents Specification JSON Schema",
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "source": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversion": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "type": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttype": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschema": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subject": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "time": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "data": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "required": [
                  "id",
                  "source",
                  "specversion",
                  "type"
                ],
                "definitions": {
                  "iddef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "sourcedef": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversiondef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "typedef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttypedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschemadef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subjectdef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "timedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "datadef": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64def": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "x-parser-schema-id": "<anonymous-schema-11>"
              }
            ],
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-9>"
              },
              "idempotencykey": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-10>"
              }
            },
            "x-parser-schema-id": "EventEnvelope"
          }
        ],
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-23>"
              }
            },
            "x-parser-schema-id": "SSoTEntityDeletedEventData"
          },
          "type": {
            "type": "string",
            "enum": [
              "classified-deleted.v1"
            ],
            "x-parser-schema-id": "SSoTEntityDeletedV1EventType"
          }
        },
        "required": [
          "data",
          "type"
        ],
        "x-parser-schema-id": "SSoTEntityDeletedEvent"
      },
      "SSoTEntityCreatedEvent": {
        "type": "object",
        "additionalProperties": false,
        "allOf": [
          {
            "type": "object",
            "allOf": [
              {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "description": "CloudEvents Specification JSON Schema",
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "source": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversion": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "type": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttype": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschema": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subject": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "time": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "data": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "required": [
                  "id",
                  "source",
                  "specversion",
                  "type"
                ],
                "definitions": {
                  "iddef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "sourcedef": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversiondef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "typedef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttypedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschemadef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subjectdef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "timedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "datadef": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64def": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "x-parser-schema-id": "<anonymous-schema-11>"
              }
            ],
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-9>"
              },
              "idempotencykey": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-10>"
              }
            },
            "x-parser-schema-id": "EventEnvelope"
          }
        ],
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-1>"
              },
              "version": {
                "type": "number",
                "x-parser-schema-id": "<anonymous-schema-2>"
              },
              "modelVersion": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-3>"
              },
              "updateDate": {
                "type": "number",
                "x-parser-schema-id": "<anonymous-schema-4>"
              },
              "property1": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-5>"
              },
              "property2": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-6>"
              },
              "property3": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-7>"
              }
            },
            "x-parser-schema-id": "SSoTEntityStateEventData"
          },
          "type": {
            "type": "string",
            "enum": [
              "classified-created.v1"
            ],
            "x-parser-schema-id": "SSoTEntityCreatedV1EventType"
          },
          "subject": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-8>"
          }
        },
        "required": [
          "data",
          "type"
        ],
        "x-parser-schema-id": "SSoTEntityCreatedEvent"
      },
      "SSoTEntityUpdatedEvent": {
        "type": "object",
        "additionalProperties": false,
        "allOf": [
          {
            "type": "object",
            "allOf": [
              {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "description": "CloudEvents Specification JSON Schema",
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "source": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversion": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "type": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttype": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschema": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subject": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "time": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "data": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "required": [
                  "id",
                  "source",
                  "specversion",
                  "type"
                ],
                "definitions": {
                  "iddef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-12>"
                  },
                  "sourcedef": {
                    "type": "string",
                    "format": "uri-reference",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-13>"
                  },
                  "specversiondef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-14>"
                  },
                  "typedef": {
                    "type": "string",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-15>"
                  },
                  "datacontenttypedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-16>"
                  },
                  "dataschemadef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "uri",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-17>"
                  },
                  "subjectdef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-18>"
                  },
                  "timedef": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "format": "date-time",
                    "minLength": 1,
                    "x-parser-schema-id": "<anonymous-schema-19>"
                  },
                  "datadef": {
                    "type": [
                      "object",
                      "string",
                      "number",
                      "array",
                      "boolean",
                      "null"
                    ],
                    "x-parser-schema-id": "<anonymous-schema-20>"
                  },
                  "data_base64def": {
                    "type": [
                      "string",
                      "null"
                    ],
                    "contentEncoding": "base64",
                    "x-parser-schema-id": "<anonymous-schema-21>"
                  }
                },
                "x-parser-schema-id": "<anonymous-schema-11>"
              }
            ],
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-9>"
              },
              "idempotencykey": {
                "type": "string",
                "format": "uuid",
                "x-parser-schema-id": "<anonymous-schema-10>"
              }
            },
            "x-parser-schema-id": "EventEnvelope"
          }
        ],
        "properties": {
          "data": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-1>"
              },
              "version": {
                "type": "number",
                "x-parser-schema-id": "<anonymous-schema-2>"
              },
              "modelVersion": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-3>"
              },
              "updateDate": {
                "type": "number",
                "x-parser-schema-id": "<anonymous-schema-4>"
              },
              "property1": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-5>"
              },
              "property2": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-6>"
              },
              "property3": {
                "type": "string",
                "x-parser-schema-id": "<anonymous-schema-7>"
              }
            },
            "x-parser-schema-id": "SSoTEntityStateEventData"
          },
          "type": {
            "type": "string",
            "enum": [
              "classified-updated.v1"
            ],
            "x-parser-schema-id": "SSoTEntityUpdatedV1EventType"
          },
          "subject": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-22>"
          }
        },
        "required": [
          "data",
          "type"
        ],
        "x-parser-schema-id": "SSoTEntityUpdatedEvent"
      },
      "EventEnvelope": {
        "type": "object",
        "allOf": [
          {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "description": "CloudEvents Specification JSON Schema",
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-12>"
              },
              "source": {
                "type": "string",
                "format": "uri-reference",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-13>"
              },
              "specversion": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-14>"
              },
              "type": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-15>"
              },
              "datacontenttype": {
                "type": [
                  "string",
                  "null"
                ],
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-16>"
              },
              "dataschema": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "uri",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-17>"
              },
              "subject": {
                "type": [
                  "string",
                  "null"
                ],
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-18>"
              },
              "time": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-19>"
              },
              "data": {
                "type": [
                  "object",
                  "string",
                  "number",
                  "array",
                  "boolean",
                  "null"
                ],
                "x-parser-schema-id": "<anonymous-schema-20>"
              },
              "data_base64": {
                "type": [
                  "string",
                  "null"
                ],
                "contentEncoding": "base64",
                "x-parser-schema-id": "<anonymous-schema-21>"
              }
            },
            "required": [
              "id",
              "source",
              "specversion",
              "type"
            ],
            "definitions": {
              "iddef": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-12>"
              },
              "sourcedef": {
                "type": "string",
                "format": "uri-reference",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-13>"
              },
              "specversiondef": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-14>"
              },
              "typedef": {
                "type": "string",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-15>"
              },
              "datacontenttypedef": {
                "type": [
                  "string",
                  "null"
                ],
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-16>"
              },
              "dataschemadef": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "uri",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-17>"
              },
              "subjectdef": {
                "type": [
                  "string",
                  "null"
                ],
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-18>"
              },
              "timedef": {
                "type": [
                  "string",
                  "null"
                ],
                "format": "date-time",
                "minLength": 1,
                "x-parser-schema-id": "<anonymous-schema-19>"
              },
              "datadef": {
                "type": [
                  "object",
                  "string",
                  "number",
                  "array",
                  "boolean",
                  "null"
                ],
                "x-parser-schema-id": "<anonymous-schema-20>"
              },
              "data_base64def": {
                "type": [
                  "string",
                  "null"
                ],
                "contentEncoding": "base64",
                "x-parser-schema-id": "<anonymous-schema-21>"
              }
            },
            "x-parser-schema-id": "<anonymous-schema-11>"
          }
        ],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "x-parser-schema-id": "<anonymous-schema-9>"
          },
          "idempotencykey": {
            "type": "string",
            "format": "uuid",
            "x-parser-schema-id": "<anonymous-schema-10>"
          }
        },
        "x-parser-schema-id": "EventEnvelope"
      },
      "SSoTEntityStateEventData": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-1>"
          },
          "version": {
            "type": "number",
            "x-parser-schema-id": "<anonymous-schema-2>"
          },
          "modelVersion": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-3>"
          },
          "updateDate": {
            "type": "number",
            "x-parser-schema-id": "<anonymous-schema-4>"
          },
          "property1": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-5>"
          },
          "property2": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-6>"
          },
          "property3": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-7>"
          }
        },
        "x-parser-schema-id": "SSoTEntityStateEventData"
      },
      "SSoTEntityCreatedV1EventType": {
        "type": "string",
        "enum": [
          "classified-created.v1"
        ],
        "x-parser-schema-id": "SSoTEntityCreatedV1EventType"
      },
      "SSoTEntityUpdatedV1EventType": {
        "type": "string",
        "enum": [
          "classified-updated.v1"
        ],
        "x-parser-schema-id": "SSoTEntityUpdatedV1EventType"
      },
      "SSoTEntityDeletedV1EventType": {
        "type": "string",
        "enum": [
          "classified-deleted.v1"
        ],
        "x-parser-schema-id": "SSoTEntityDeletedV1EventType"
      },
      "SSoTEntityDeletedEventData": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "x-parser-schema-id": "<anonymous-schema-23>"
          }
        },
        "x-parser-schema-id": "SSoTEntityDeletedEventData"
      }
    }
  },
  "x-parser-spec-parsed": true,
  "x-parser-api-version": 1
}