import { Link, useLocation } from "wouter";
import { QrCode, Package, BarChart3, Menu, Settings, DollarSign, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "@/contexts/LocalizationContext";
import type { Currency } from "@/lib/format";

export default function Navigation() {
  const [location] = useLocation();
  const { currency, setCurrency } = useCurrency();
  const { t, language, setLanguage } = useTranslation();

  const navItems = [
    { path: "/scanner", label: t("navigation.scanner"), icon: QrCode },
    { path: "/products", label: t("navigation.products"), icon: Package },
    { path: "/analytics", label: t("navigation.analytics"), icon: BarChart3 },
  ];

  const isActive = (path: string) => {
    if (path === "/scanner") return location === "/" || location === "/scanner";
    return location === path;
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-material-blue text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-2 md:px-4 py-2 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <img src="/reev_logo.png" alt="REEV" className="w-8 h-8 md:w-12 md:h-12" />
              <h1 className="text-lg md:text-2xl font-medium">REEV BOUTIK</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-6">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant="ghost"
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-blue-600 text-white"
                          : "text-white hover:bg-blue-600"
                      }`}
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
              
              {/* Language and Currency Selectors */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Language Selector */}
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-white/70" />
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-24 h-8 bg-blue-600/50 border-blue-400 text-white text-sm hover:bg-blue-600/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">{t("language.fr")}</SelectItem>
                      <SelectItem value="en">{t("language.en")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Currency Selector */}
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-white/70" />
                  <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                    <SelectTrigger className="w-28 h-8 bg-blue-600/50 border-blue-400 text-white text-sm hover:bg-blue-600/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FCFA">FCFA</SelectItem>
                      <SelectItem value="EUR">EUR €</SelectItem>
                      <SelectItem value="USD">USD $</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        className="w-full justify-start space-x-2"
                        data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                  
                  {/* Mobile Language and Currency Selectors */}
                  <div className="border-t pt-4 space-y-4">
                    {/* Language Selector */}
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">{t("navigation.language")}</label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">{t("language.fr")}</SelectItem>
                            <SelectItem value="en">{t("language.en")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Currency Selector */}
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">{t("navigation.currency")}</label>
                        <Select value={currency} onValueChange={(value: Currency) => setCurrency(value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FCFA">FCFA</SelectItem>
                            <SelectItem value="EUR">EUR €</SelectItem>
                            <SelectItem value="USD">USD $</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-card border-t border-gray-200 dark:border-border px-4 py-2 z-40">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                className={`flex flex-col items-center py-2 px-3 min-h-[60px] ${
                  isActive(item.path)
                    ? "text-material-blue"
                    : "text-gray-600 dark:text-gray-400"
                }`}
                data-testid={`bottom-nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            className="flex flex-col items-center py-2 px-3 min-h-[60px] text-gray-600 dark:text-gray-400"
            data-testid="bottom-nav-settings"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs mt-1">{t("navigation.settings")}</span>
          </Button>
        </div>
      </nav>
    </>
  );
}
