import ComingSoon from '@/components/ComingSoon';
import { FaCube } from 'react-icons/fa';

export default function MinecraftPage() {
  const features = [
    {
      title: 'Official Server',
      description: 'Join the WarriorPixel Minecraft server with custom plugins and mods'
    },
    {
      title: 'In-Game Shop',
      description: 'Purchase ranks, cosmetics, and items using your wallet balance'
    },
    {
      title: 'PvP Arenas',
      description: 'Compete in custom PvP arenas and earn tournament prizes'
    },
    {
      title: 'Custom Game Modes',
      description: 'SkyBlock, Survival, Creative, Minigames, and more!'
    },
    {
      title: 'Rank System',
      description: 'Level up your rank with exclusive perks and abilities'
    },
    {
      title: 'Community Events',
      description: 'Weekly events, building competitions, and special tournaments'
    }
  ];

  return (
    <ComingSoon
      title="Minecraft Server"
      subtitle="A premium Minecraft experience with custom content and rewards!"
      icon={FaCube}
      iconColor="text-green-400"
      gradientFrom="from-green-600"
      gradientTo="to-green-800"
      features={features}
      estimatedLaunch="Q3 2026"
    />
  );
}
