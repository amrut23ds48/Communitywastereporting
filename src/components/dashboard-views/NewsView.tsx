import React, { useState } from 'react';
import { Calendar, MapPin, ArrowRight, Users, Clock, Megaphone, ChevronRight } from 'lucide-react';

export function NewsView() {
  const [activeTab, setActiveTab] = useState<'all' | 'drives' | 'updates'>('all');

  const newsItems = [
    {
      id: 1,
      type: 'drive',
      title: "Mega Beach Cleanup: Juhu Beach",
      date: "Sunday, Oct 28 • 7:00 AM",
      location: "Juhu Beach Main Entrance",
      image: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&q=80&w=800",
      description: "Join over 500 volunteers in our monthly mega cleanup drive. Gloves and bags provided. Refreshments served after the event.",
      attendees: 124,
      tag: "Community Event",
      featured: true
    },
    {
      id: 2,
      type: 'updates',
      title: "New Waste Segregation Rules 2025",
      date: "Yesterday",
      location: "Municipal Corporation",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600",
      description: "The city has introduced strict penalties for mixing wet and dry waste. Learn about the new color-coded bin system effective from next month.",
      attendees: null,
      tag: "Policy Update",
      featured: false
    },
    {
      id: 3,
      type: 'drive',
      title: "Tree Plantation Drive: Green Sector 4",
      date: "Nov 2 • 9:00 AM",
      location: "Central Park, Sector 4",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600",
      description: "Help us plant 50 native trees to improve local air quality. Bring your family for this fun eco-educational event.",
      attendees: 45,
      tag: "Environment",
      featured: false
    },
    {
      id: 4,
      type: 'updates',
      title: "Smart Bins Installed in Market Area",
      date: "2 days ago",
      location: "City Center",
      image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
      description: "20 new IoT-enabled smart bins have been installed in the main market to prevent overflow and optimize collection routes.",
      attendees: null,
      tag: "Technology",
      featured: false
    }
  ];

  const filteredNews = activeTab === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.type === activeTab);

  const featuredItem = newsItems.find(i => i.featured);
  const displayItems = filteredNews.filter(i => !i.featured || activeTab !== 'all');

  return (
    <div className="relative min-h-[600px]">
      
      {/* --- BACKGROUND GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute right-0 top-0 h-[400px] w-[400px] bg-emerald-100/40 rounded-full blur-[100px] -z-10"></div>
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* --- HEADER & FILTERS --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-emerald-600" />
              Community Buzz
            </h2>
            <p className="text-gray-500 text-sm">Stay updated with the latest drives and policies</p>
          </div>

          <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm inline-flex">
            {['all', 'drives', 'updates'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'all' && 'All Stories'}
                {tab === 'drives' && 'Events'}
                {tab === 'updates' && 'News'}
              </button>
            ))}
          </div>
        </div>

        {/* --- FEATURED ITEM (Only visible in 'All' view) --- */}
        {activeTab === 'all' && featuredItem && (
          <div className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-emerald-900/5 border border-gray-100">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 md:hidden" />
                <img 
                  src={featuredItem.image} 
                  alt={featuredItem.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 left-4 z-20">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                    Featured Event
                  </span>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  {featuredItem.date}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-emerald-700 transition-colors">
                  {featuredItem.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {featuredItem.description}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600">
                      +{featuredItem.attendees && featuredItem.attendees - 3}
                    </div>
                  </div>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2">
                    Register Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- NEWS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden group flex flex-col h-full">
              
              {/* Image */}
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
                    item.type === 'drive' 
                      ? 'bg-white/90 text-emerald-700' 
                      : 'bg-white/90 text-blue-700'
                  }`}>
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.location}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  {item.type === 'drive' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5" />
                      {item.attendees} going
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      2 min
                    </div>
                  )}
                  
                  <button className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
                    Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}