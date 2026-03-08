import ComingSoon from '@/components/ComingSoon';
import { FaGamepad } from 'react-icons/fa';

export default function GamesPage() {
  const features = [
    {
      title: 'Multiple Games',
      description: 'Play a variety of browser-based games directly on WarriorPixel'
    },
    {
      title: 'Earn Rewards',
      description: 'Win coins, gems, and vouchers by playing and winning games'
    },
    {
      title: 'Leaderboards',
      description: 'Compete with other players and climb the global rankings'
    },
    {
      title: 'Daily Challenges',
      description: 'Complete challenges for bonus rewards and achievements'
    },
    {
      title: 'Multiplayer Modes',
      description: 'Challenge friends or play against random opponents online'
    },
    {
      title: 'Tournament Integration',
      description: 'Special gaming tournaments with exclusive prizes'
    }
  ];

  return (
    <ComingSoon
      title="Games Section"
      subtitle="Get ready for an epic collection of browser games with rewards!"
      icon={FaGamepad}
      iconColor="text-purple-400"
      gradientFrom="from-purple-600"
      gradientTo="to-purple-800"
      features={features}
      estimatedLaunch="Q2 2026"
    />
  );
}
