using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public class ScheduledService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public ScheduledService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTimeUtility.Now();
                var nextRun = DateTime.Today.AddHours(InventoryConfig.NotificationHour);
                if (now > nextRun) nextRun = nextRun.AddDays(1);
                var delay = nextRun - now;

                await Task.Delay(delay, stoppingToken);
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var goodsService = scope.ServiceProvider.GetRequiredService<IGoodsService>();
                        await goodsService.PerformDailyGoodsCheck();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in DailyInventoryWorker: {ex.Message}");
                }
            }
        }
    }
}
