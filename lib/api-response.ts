import { NextResponse } from "next/server"

export interface ApiError {
  code: string
  message: string
  details?: { field: string; reason: string; message: string }[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiError | null
  meta: {
    requestId: string
    timestamp: string
  }
}

function requestId(): string {
  return crypto.randomUUID()
}

function timestamp(): string {
  return new Date().toISOString()
}

export function successResponse<T>(data: T, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    meta: { requestId: requestId(), timestamp: timestamp() },
  }
  return NextResponse.json(body, { status })
}

export function errorResponse(code: string, message: string, status: number) {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: { code, message },
    meta: { requestId: requestId(), timestamp: timestamp() },
  }
  return NextResponse.json(body, { status })
}

export function validationError(message: string, details?: ApiError["details"]) {
  const body: ApiResponse<null> = {
    success: false,
    data: null,
    error: { code: "VALIDATION_ERROR", message, details },
    meta: { requestId: requestId(), timestamp: timestamp() },
  }
  return NextResponse.json(body, { status: 422 })
}

export function notFound(message = "Resource not found") {
  return errorResponse("NOT_FOUND", message, 404)
}

export function conflict(message: string) {
  return errorResponse("CONFLICT", message, 409)
}

export function unauthorized(message = "Authentication required") {
  return errorResponse("UNAUTHORIZED", message, 401)
}

export function forbidden(message = "Insufficient permissions") {
  return errorResponse("FORBIDDEN", message, 403)
}

export function internalError(message = "An unexpected error occurred") {
  return errorResponse("INTERNAL_ERROR", message, 500)
}