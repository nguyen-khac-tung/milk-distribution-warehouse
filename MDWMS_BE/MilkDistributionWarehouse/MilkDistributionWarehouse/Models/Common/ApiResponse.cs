namespace MilkDistributionWarehouse.Models.Common
{
    public class ApiResponse<T>
    {
        //  StatusCode (mã trạng thái HTTP, ví dụ: 200, 400, 500)
        public int StatusCode { get; set; } = 200;

        //  Message (thông điệp phản hồi, ví dụ: "Success" hoặc "Invalid input")
        public string Message { get; set; } = string.Empty;

        //  Data (dữ liệu trả về, có thể null)
        public T? Data { get; set; }

        //  Success (xác định phản hồi có thành công hay không)
        public bool Success => StatusCode >= 200 && StatusCode < 300;

        public ApiResponse() { }

        public ApiResponse(int statusCode, string message, T? data = default)
        {
            StatusCode = statusCode;
            Message = message;
            Data = data;
        }

        // Phương thức tĩnh để tạo phản hồi thành công
        public static ApiResponse<T> SuccessResponse(T data, string message = "Success", int statusCode = 200)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = data
            };
        }

        // Phương thức tĩnh để tạo phản hồi lỗi
        public static ApiResponse<T> ErrorResponse(string message, int statusCode = 400, T? data = default)
        {
            return new ApiResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = data
            };
        }

        // Phương thức tĩnh cho lỗi không tìm thấy (404)
        public static ApiResponse<T> NotFoundResponse(string message = "Resource not found")
        {
            return ErrorResponse(message, 404);
        }

        // Phương thức tĩnh cho lỗi không được phép (403)
        public static ApiResponse<T> ForbiddenResponse(string message = "Access denied")
        {
            return ErrorResponse(message, 403);
        }

        // Phương thức tĩnh cho lỗi không xác thực (401)
        public static ApiResponse<T> UnauthorizedResponse(string message = "Unauthorized")
        {
            return ErrorResponse(message, 401);
        }

        // Phương thức tĩnh cho lỗi server (500)
        public static ApiResponse<T> ServerErrorResponse(string message = "Internal server error")
        {
            return ErrorResponse(message, 500);
        }
    }
}
