import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';

const MobileGuard: React.FC = () => {
    const [isMobilePortrait, setIsMobilePortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            const isSmallScreen = window.innerWidth < 768;
            setIsMobilePortrait(isPortrait && isSmallScreen);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    if (!isMobilePortrait) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-primary-500 to-secondary-500 flex flex-items-center justify-center p-6 text-white text-center">
            <div className="max-w-xs space-y-6">
                <div className="flex justify-center relative">
                    <Monitor size={120} className="text-white/20" />
                    <Smartphone size={60} className="absolute bottom-0 right-0 animate-bounce text-white" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">建议使用大屏访问</h2>
                    <p className="text-white/80 leading-relaxed">
                        为了孩子的视力健康与最佳学习体验，本应用仅支持电脑、平板或手机横屏访问。
                    </p>
                </div>

                <div className="pt-4">
                    <div className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                        请旋转手机或更换设备
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileGuard;
