using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MilkDistributionWarehouse.Utilities;
using System.Text.RegularExpressions;

namespace MilkDistributionWarehouse.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.GetUserId();
            if (userId != null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId.ToString());
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.GetUserId();
            if (userId != null)
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId.ToString());
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
