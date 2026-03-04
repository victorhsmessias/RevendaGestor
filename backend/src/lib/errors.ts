export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = 'Pagamento necessário') {
    super(message, 402)
    this.name = 'PaymentRequiredError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, string>) {
    super(message, 400, details)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Registro já existe') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}
