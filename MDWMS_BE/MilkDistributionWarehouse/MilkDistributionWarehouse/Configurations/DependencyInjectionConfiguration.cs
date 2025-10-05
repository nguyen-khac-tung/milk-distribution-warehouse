using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Services;
using Online_Learning.Services.Ultilities;

namespace MilkDistributionWarehouse.Configurations
{
    public static class DependencyInjectionConfiguration
    {
        public static void AddDependencyInjection(this IServiceCollection services)
        {
            //User
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUserService, UserService>();

            //Email
            services.AddSingleton<EmailUtility>();
        }
    }
}
