import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Package,
  Bell,
  Search,
  ChevronDown,
  User,
  MapPin,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { stores } from '@/data/stores';

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
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { selectedStore, setSelectedStore, clearSelectedStore } = useStore();

  const currentPath = location.pathname;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowStoreDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {selectedStore && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {selectedStore.name}
              </span>
              <button
                onClick={clearSelectedStore}
                className="ml-1 w-5 h-5 rounded hover:bg-blue-100 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-colors"
                title="查看全部门店"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{selectedStore ? selectedStore.name : '全部门店'}</span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform',
                  showStoreDropdown && 'rotate-180'
                )}
              />
            </button>

            {showStoreDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-3 py-2 border-b border-gray-50">
                  <p className="text-xs text-gray-400">选择门店</p>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  <button
                    onClick={() => {
                      clearSelectedStore();
                      setShowStoreDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors',
                      !selectedStore && 'text-blue-600 bg-blue-50'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      全部门店
                    </span>
                    {!selectedStore && <Check className="w-4 h-4" />}
                  </button>
                  <div className="h-px bg-gray-50 mx-3 my-1"></div>
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStore(store.id);
                        setShowStoreDropdown(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors',
                        selectedStore?.id === store.id &&
                          'text-blue-600 bg-blue-50'
                      )}
                    >
                      <div>
                        <p className="font-medium">{store.name}</p>
                        <p className="text-xs text-gray-400">{store.city}</p>
                      </div>
                      {selectedStore?.id === store.id && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索患者、批次..."
              className="w-56 h-9 pl-9 pr-4 bg-gray-50 border border-transparent rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-50 transition-all duration-200"
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
