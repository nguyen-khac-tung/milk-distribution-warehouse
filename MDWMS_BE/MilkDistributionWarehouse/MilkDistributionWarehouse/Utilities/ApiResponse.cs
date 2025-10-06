using Microsoft.AspNetCore.Mvc;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MilkDistributionWarehouse.Utilities
{
    public class ApiResponse<T>
    {
        public int StatusCode { get; set; } = 200;
        
        public string Message { get; set; } = string.Empty;

        public T? Data { get; set; }

        public bool Success => StatusCode >= 200 && StatusCode < 300;

        public ApiResponse() { }


        public static IResult ToResultOk(string message = "Success", int statusCode = 200)
        {
            return Results.Ok(new ApiResponse<T> { Message = message, StatusCode = statusCode });
        }

        public static IResult ToResultOk(T data, string message = "Success", int statusCode = 200)
        {
            return Results.Ok(new ApiResponse<T> { Data = data, Message = message, StatusCode = statusCode });
        }

        public static IResult ToResultError(string message, int statusCode = 400, T? data = default)
        {
            return Results.BadRequest(new ApiResponse<T> { Data = data, Message = message, StatusCode = statusCode });
        }
    }
}
