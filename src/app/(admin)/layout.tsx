import "./../globals.css";
import AdminHeader from "@/components/AdminHeader/AdminHeader";


export const fetchCache = 'force-no-store';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <div className={`overflow-hidden`}>
            <div className="min-h-screen flex flex-col relative"
                style={{ backgroundColor: '#F1F5F9' }}>
                <AdminHeader />
                <main>{children}</main>
            </div>
        </div>

    );
}
