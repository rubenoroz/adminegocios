import { WifiOff, Laptop, RefreshCw, Layers, Globe, MonitorSmartphone } from "lucide-react";

export function Features({ dict }: { dict: any }) {
    return (
        <section className="features-section w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container px-4 md:px-6">
                <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-3">
                    <FeatureCard
                        icon={WifiOff}
                        title={dict.offline}
                        description={dict.offlineDesc}
                    />
                    <FeatureCard
                        icon={Layers}
                        title={dict.adaptable}
                        description={dict.adaptableDesc}
                    />
                    <FeatureCard
                        icon={MonitorSmartphone}
                        title={dict.premium}
                        description={dict.premiumDesc}
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon: Icon, title, description }: any) {
    return (
        <div className="flex flex-col items-center space-y-2 border-gray-800 p-4 rounded-lg">
            <div className="p-2 bg-black bg-opacity-50 rounded-full">
                <Icon className="text-white h-6 w-6 mb-2 opacity-75" />
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{description}</p>
        </div>
    );
}
