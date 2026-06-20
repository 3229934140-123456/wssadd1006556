import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Package,
  Bell,
  Search,
  ChevronDown,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  key: string;
  label: string;
  icon: typeof Building2;
  path: string;
}

const navItems: NavItem[] = [
  { key: 'overview', label: '门店概览', icon: Building2, path: '/' },
  { key: 'patients', label: '患者风险', icon: Users, path: '/patients' },
  { key: 'batches', label: '批次追踪', icon: Package, path: '/batches' },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentPath = location.pathname;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                矫治器运营看板
              </h1>
              <p className="text-[10px] text-gray-400 leading-tight">
                Orthodontics Operation Dashboard
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索门店、患者、批次..."
              className="w-64 h-9 pl-9 pr-4 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-50 transition-all duration-200"
            />
          </div>

          <button className="relative w-9 h-9 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="h-6 w-px bg-gray-200"></div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">运营管理员</p>
                <p className="text-xs text-gray-400">总部运营中心</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  个人设置
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
