using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace MilkDistributionWarehouse.Utilities
{
    public class WordExportUtility
    {
        /// <summary>
        /// Điền dữ liệu vào mẫu Word.
        /// </summary>
        /// <param name="templatePath">Đường dẫn tuyệt đối tới file .docx mẫu</param>
        /// <param name="simpleData">Dữ liệu dạng Key-Value (VD: $NguoiNhan -> Nguyen Van A)</param>
        /// <param name="tableData">Dữ liệu dạng danh sách cho bảng</param>
        /// <returns>Mảng byte của file kết quả</returns>
        public static byte[] FillTemplate(string templatePath, Dictionary<string, string> simpleData, List<Dictionary<string, string>> tableData = null)
        {
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException($"Template not found: {templatePath}");
            }

            using (var memoryStream = new MemoryStream())
            {
                // Copy file mẫu vào memory
                var templateBytes = File.ReadAllBytes(templatePath);
                memoryStream.Write(templateBytes, 0, templateBytes.Length);
                memoryStream.Position = 0; // Reset vị trí stream về đầu

                using (var wordDoc = WordprocessingDocument.Open(memoryStream, true))
                {
                    var body = wordDoc.MainDocumentPart.Document.Body;

                    // 1. Thay thế các biến đơn (Header, Footer, Info)
                    if (simpleData != null)
                    {
                        ReplaceSimpleTags(body, simpleData);
                    }

                    // 2. Xử lý bảng (Table) nếu có dữ liệu danh sách
                    if (tableData != null && tableData.Any())
                    {
                        FillTableData(body, tableData);
                    }

                    // Lưu thay đổi
                    wordDoc.MainDocumentPart.Document.Save();
                }

                return memoryStream.ToArray();
            }
        }

        private static void ReplaceSimpleTags(Body body, Dictionary<string, string> replacements)
        {
            var texts = body.Descendants<Text>().ToList();
            foreach (var text in texts)
            {
                // Thay thế trực tiếp text nếu chứa key (VD: chứa "$NguoiNhan")
                foreach (var item in replacements)
                {
                    if (text.Text.Contains(item.Key))
                    {
                        text.Text = text.Text.Replace(item.Key, item.Value);
                    }
                }
            }
        }

        private static void FillTableData(Body body, List<Dictionary<string, string>> tableData)
        {
            // Lấy key đầu tiên của dòng dữ liệu để tìm bảng tương ứng trong Word
            // Ví dụ: dữ liệu có key "$TenHang" -> Tìm bảng nào có chứa text "$TenHang"
            var firstKey = tableData.First().Keys.First();

            // Tìm bảng chứa placeholder
            var table = body.Descendants<Table>().FirstOrDefault(t => t.InnerText.Contains(firstKey));
            if (table == null) return;

            // Tìm dòng mẫu (Template Row) - Dòng chứa placeholder đó
            var templateRow = table.Elements<TableRow>().FirstOrDefault(r => r.InnerText.Contains(firstKey));
            if (templateRow == null) return;

            // Duyệt qua từng dòng dữ liệu cần đổ vào
            foreach (var rowData in tableData)
            {
                // Clone dòng mẫu
                var newRow = (TableRow)templateRow.CloneNode(true);

                // Thay thế dữ liệu trong dòng mới clone
                var texts = newRow.Descendants<Text>();
                foreach (var text in texts)
                {
                    foreach (var item in rowData)
                    {
                        if (text.Text.Contains(item.Key))
                        {
                            text.Text = text.Text.Replace(item.Key, item.Value);
                        }
                    }
                }

                // Chèn dòng mới vào TRƯỚC dòng mẫu
                table.InsertBefore(newRow, templateRow);
            }

            // Xóa dòng mẫu đi sau khi đã chèn xong dữ liệu
            templateRow.Remove();
        }
    }
}
