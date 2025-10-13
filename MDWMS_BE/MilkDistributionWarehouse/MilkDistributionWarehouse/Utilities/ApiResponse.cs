using Microsoft.AspNetCore.Mvc;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MilkDistributionWarehouse.Utilities
{
    public class ApiResponse<T>
    {
        public int Status { get; set; } = 200;
        
        public string Message { get; set; } = string.Empty;

        public T? Data { get; set; }

        public bool Success => Status >= 200 && Status < 300;

        public ApiResponse() { }


        public static IActionResult ToResultOkMessage(string message = "", int statusCode = 200)
        {
            return new OkObjectResult(new ApiResponse<T> { Message = message, Status = statusCode });
        }

        public static IActionResult ToResultOk(T? data, string message = "", int statusCode = 200)
        {
            return new OkObjectResult(new ApiResponse<T> { Data = data, Message = message, Status = statusCode });
        }

        public static IActionResult ToResultError(string message, int statusCode = 400, T? data = default)
        {
            return new BadRequestObjectResult(new ApiResponse<T> { Data = data, Message = message, Status = statusCode });
        }
    }
}
