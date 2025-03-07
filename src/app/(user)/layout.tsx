import "./../globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    
      <div className={`overflow-hidden`}>
        <div className="min-h-screen bg-gray-0 flex flex-col justify-between relative">
          <main>{children}</main>
        </div>
      </div>

  );
}
