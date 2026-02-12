'use client';

import { useState } from 'react';
import { FaVideo, FaYoutube, FaInstagram, FaPlay, FaExternalLinkAlt } from 'react-icons/fa';

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const videos = [
    {
      id: 1,
      title: 'Top 10 Free Fire Tips & Tricks 2026',
      creator: 'Ninja Hazuto',
      platform: 'youtube',
      category: 'tutorial',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      views: '125K',
      duration: '12:34',
    },
    {
      id: 2,
      title: 'WarriorPixel Tournament Highlights - Epic Moments',
      creator: 'Phoenix',
      platform: 'youtube',
      category: 'highlights',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      views: '89K',
      duration: '8:45',
    },
    {
      id: 3,
      title: 'Best Clutch Plays of the Month',
      creator: 'RDX Warrior',
      platform: 'instagram',
      category: 'highlights',
      thumbnail: 'https://via.placeholder.com/640x360/ff0050/ffffff?text=Instagram+Reel',
      url: 'https://instagram.com/reel/example',
      views: '45K',
      duration: '0:59',
    },
    {
      id: 4,
      title: 'How to Win More Tournaments - Pro Strategies',
      creator: 'Prime',
      platform: 'youtube',
      category: 'tutorial',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      views: '67K',
      duration: '15:20',
    },
    {
      id: 5,
      title: 'Behind the Scenes - Tournament Setup',
      creator: 'Devourer',
      platform: 'youtube',
      category: 'other',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      views: '32K',
      duration: '6:12',
    },
    {
      id: 6,
      title: 'Insane Headshots Compilation',
      creator: 'Suraj',
      platform: 'instagram',
      category: 'highlights',
      thumbnail: 'https://via.placeholder.com/640x360/833ab4/ffffff?text=Instagram+Video',
      url: 'https://instagram.com/p/example',
      views: '98K',
      duration: '1:30',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'tutorial', label: 'Tutorials' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'other', label: 'Other' },
  ];

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <FaVideo />
          Videos
        </h1>
        <p className="text-white text-opacity-90">Watch gaming content from our top creators</p>
      </div>

      {/* Category Filters */}
      <div className="bg-discord-dark rounded-xl p-4 border border-gray-800">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white bg-opacity-5 text-discord-text hover:bg-opacity-10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-discord-dark rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-900">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaPlay className="text-white text-xl ml-1" />
                </div>
              </div>
              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded text-xs font-semibold">
                {video.duration}
              </div>
              {/* Platform Badge */}
              <div className="absolute top-2 left-2">
                {video.platform === 'youtube' ? (
                  <div className="bg-red-600 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold">
                    <FaYoutube />
                    YouTube
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded flex items-center gap-1 text-xs font-bold">
                    <FaInstagram />
                    Instagram
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <p className="text-discord-text">{video.creator}</p>
                <p className="text-discord-text">{video.views} views</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Channels Section */}
      <div className="bg-discord-dark rounded-xl p-6 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaYoutube className="text-red-500" />
          Our Creators
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Ninja Hazuto', 'Phoenix', 'RDX Warrior', 'Prime', 'Suraj', 'Devourer', 'Innocent'].map((creator) => (
            <div
              key={creator}
              className="bg-white bg-opacity-5 rounded-lg p-4 text-center hover:bg-opacity-10 transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl font-bold">
                {creator.charAt(0)}
              </div>
              <p className="font-semibold text-white text-sm">{creator}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Want to Feature Your Content?</h2>
        <p className="text-white text-opacity-90 mb-4">Contact us on Discord to get your videos featured!</p>
        <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all inline-flex items-center gap-2">
          <FaExternalLinkAlt />
          Join Our Discord
        </button>
      </div>
    </div>
  );
}
