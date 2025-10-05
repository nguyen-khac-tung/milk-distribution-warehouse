using System.Net;
using System.Net.Mail;

namespace Online_Learning.Services.Ultilities
{
    public class EmailUtility
    {
        private readonly IConfiguration _configuration;

        public EmailUtility(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendMail(string toEmail, string subject, string body)
        {
            MailMessage message = new MailMessage()
            {
                From = new MailAddress(_configuration["MailSettings:From"] ?? ""),
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
                SubjectEncoding = System.Text.Encoding.UTF8,
                BodyEncoding = System.Text.Encoding.UTF8,
            };
            message.To.Add(toEmail);

            using var smtpClient = new SmtpClient();
            smtpClient.Host = _configuration["MailSettings:Host"] ?? "";
            smtpClient.Port = int.Parse(_configuration["MailSettings:Port"] ?? "587");
            smtpClient.Credentials = new NetworkCredential(
                _configuration["MailSettings:UserName"],
                _configuration["MailSettings:Password"]
            );
            smtpClient.EnableSsl = true;

            await smtpClient.SendMailAsync(message);
        }
    }
}
