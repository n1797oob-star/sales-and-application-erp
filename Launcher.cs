using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("====================================================");
        Console.WriteLine("    TMI Sales & Application Management ERP Launcher   ");
        Console.WriteLine("====================================================");
        Console.WriteLine();
        Console.WriteLine("Starting TMI ERP Server and launching browser...");

        try
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;

            // Start Vite dev server in background using cmd /c
            ProcessStartInfo serverInfo = new ProcessStartInfo();
            serverInfo.FileName = "cmd.exe";
            serverInfo.Arguments = "/c npm run dev";
            serverInfo.WorkingDirectory = appDir;
            serverInfo.UseShellExecute = false;
            serverInfo.CreateNoWindow = true;

            Process serverProcess = Process.Start(serverInfo);

            Console.WriteLine("Server process started. Waiting for initialization...");
            Thread.Sleep(2500);

            // Launch Default Web Browser to http://localhost:3000
            Console.WriteLine("Opening web browser at http://localhost:3000 ...");
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:3000",
                UseShellExecute = true
            });

            Console.WriteLine();
            Console.WriteLine("SUCCESS! TMI ERP Application is now running in your browser.");
            Console.WriteLine("Press any key to close this launcher window (server will keep running)...");
            Thread.Sleep(1000);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error launching application: " + ex.Message);
            Console.WriteLine("Press any key to exit.");
            Console.ReadKey();
        }
    }
}
