import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export default function NotFound() { return <div className="page-container py-24"><p className="eyebrow">404</p><h1 className="text-4xl font-semibold">Сторінку не знайдено</h1><p className="my-6 text-muted-foreground">Перевірте адресу або поверніться до гри.</p><Button asChild><Link to="/play">Грати в шахи</Link></Button></div>; }
