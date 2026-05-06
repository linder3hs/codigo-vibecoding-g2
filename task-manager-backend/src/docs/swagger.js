import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'API para gestión de tareas',
      contact: {
        name: 'API Support',
        email: 'support@taskmanager.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identificador único de la tarea'
            },
            title: {
              type: 'string',
              description: 'Título de la tarea'
            },
            description: {
              type: 'string',
              description: 'Descripción de la tarea'
            },
            completed: {
              type: 'boolean',
              description: 'Estado de completada',
              default: false
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            }
          }
        },
        TaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              description: 'Título de la tarea'
            },
            description: {
              type: 'string',
              description: 'Descripción de la tarea'
            },
            completed: {
              type: 'boolean',
              description: 'Estado de completada'
            }
          }
        },
        TaskUpdate: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Título de la tarea'
            },
            description: {
              type: 'string',
              description: 'Descripción de la tarea'
            },
            completed: {
              type: 'boolean',
              description: 'Estado de completada'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error'
            }
          }
        }
      }
    },
    paths: {
      '/tasks': {
        get: {
          summary: 'Obtener todas las tareas',
          tags: ['Tasks'],
          responses: {
            200: {
              description: 'Lista de tareas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Task'
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          summary: 'Crear una nueva tarea',
          tags: ['Tasks'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TaskInput'
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Tarea creada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            }
          }
        }
      },
      '/tasks/{id}': {
        get: {
          summary: 'Obtener una tarea por ID',
          tags: ['Tasks'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              },
              description: 'ID de la tarea'
            }
          ],
          responses: {
            200: {
              description: 'Tarea encontrada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            },
            404: {
              description: 'Tarea no encontrada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        },
        put: {
          summary: 'Actualizar una tarea',
          tags: ['Tasks'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              },
              description: 'ID de la tarea'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TaskUpdate'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Tarea actualizada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Task'
                  }
                }
              }
            },
            404: {
              description: 'Tarea no encontrada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        },
        delete: {
          summary: 'Eliminar una tarea',
          tags: ['Tasks'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
                format: 'uuid'
              },
              description: 'ID de la tarea'
            }
          ],
          responses: {
            204: {
              description: 'Tarea eliminada'
            },
            404: {
              description: 'Tarea no encontrada',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);