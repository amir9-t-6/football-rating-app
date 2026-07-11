import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Rating App",
  description: "7-a-side player rating app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}