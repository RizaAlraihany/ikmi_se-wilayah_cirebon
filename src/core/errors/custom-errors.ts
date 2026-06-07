export class AppError extends Error {
  public statusCode: number

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error') {
    super(message, 400)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized Access') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden Access') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}
