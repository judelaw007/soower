import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Sprout,
  Users,
  Home,
  History,
  User,
  ChevronRight,
  CreditCard,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  Gift,
  Loader2,
  Globe,
  BookOpen
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- MOCK DATA FOR FALLBACK ---
// Updated: Removed targets/raised to reflect "Ongoing" nature
const INITIAL_CAMPAIGNS = [
  {
    id: 'widowcare-001',
    title: 'Widow Care',
    category: 'Relief & Support',
    description: 'Sustaining widows through financial aid, food support, and business empowerment grants. An ongoing commitment to care for the vulnerable.',
    image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=800',
    color: 'bg-rose-500',
    icon: Heart
  },
  {
    id: 'dad-project-001',
    title: 'The DAD Project',
    category: 'Orphans & Education',
    description: 'Developing Academically and Discipling (DAD). Providing comprehensive educational sponsorship and mentorship for orphans.',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800',
    color: 'bg-blue-500',
    icon: BookOpen
  },
  {
    id: 'missioncare-001',
    title: 'Mission Care',
    category: 'Global Missions',
    description: 'Equipping missionaries in remote fields with the resources they need to spread the Gospel effectively.',
    image: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&q=80&w=800',
    color: 'bg-amber-500',
    icon: Globe
  }
];

// --- COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }) => {
  const baseStyle = "flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-700 text-white shadow-lg shadow-green-700/30 hover:bg-green-800",
    secondary: "bg-amber-100 text-amber-900 hover:bg-amber-200",
    outline: "border-2 border-gray-200 text-gray-600 hover:border-green-600 hover:text-green-700",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDonating, setIsDonating] = useState(false);

  // Auth & Initial Data Load
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Public Campaigns
  useEffect(() => {
    if (!user) return;

    // RULE 1: Strict Path for Public Data
    const campaignsRef = collection(db, 'artifacts', appId, 'public', 'data', 'campaigns');

    const unsubscribe = onSnapshot(campaignsRef,
      (snapshot) => {
        if (snapshot.empty) {
          setCampaigns(INITIAL_CAMPAIGNS);
        } else {
          const loadedCampaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCampaigns(loadedCampaigns);
        }
      },
      (error) => {
        console.error("Error fetching campaigns:", error);
        setCampaigns(INITIAL_CAMPAIGNS); // Fallback on error
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch User Donations
  useEffect(() => {
    if (!user) return;

    // RULE 1: Strict Path for User Data
    const donationsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'donations');

    const unsubscribe = onSnapshot(donationsRef,
      (snapshot) => {
        const loadedDonations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Manual sort since we can't use complex queries easily
        loadedDonations.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setDonations(loadedDonations);
      },
      (error) => console.error("Error fetching donations:", error)
    );

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS ---

  const handleDonate = async (amount, paymentMethod) => {
    if (!user || !selectedCampaign) return;

    setIsDonating(true);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 1. Record Donation in User's Private Collection
      const donationData = {
        amount: Number(amount),
        campaignId: selectedCampaign.id,
        campaignTitle: selectedCampaign.title,
        status: 'completed',
        timestamp: serverTimestamp(),
        paymentMethod
      };

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'donations'), donationData);

      setSelectedCampaign(null);
      setActiveTab('history'); // Switch to history to show the new donation

    } catch (error) {
      console.error("Donation failed:", error);
      alert("Something went wrong with the donation. Please try again.");
    } finally {
      setIsDonating(false);
    }
  };

  // --- RENDER HELPERS ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-green-700 mb-4" size={40} />
        <p className="text-gray-500 font-medium">Loading Soower...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-0 md:pl-20">

      {/* MOBILE HEADER */}
      <div className="bg-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm md:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-green-700 p-1.5 rounded-lg">
            <Sprout className="text-white" size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Soower</span>
        </div>
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs">
          {user?.isAnonymous ? 'G' : user?.email?.[0].toUpperCase()}
        </div>
      </div>

      {/* DESKTOP SIDEBAR (Responsive) */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-200 flex-col items-center py-6 gap-8 z-20">
        <div className="bg-green-700 p-2 rounded-xl">
          <Sprout className="text-white" size={24} />
        </div>
        <nav className="flex flex-col gap-6 w-full px-2">
          {['home', 'history', 'profile'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`p-3 rounded-xl flex justify-center transition-colors ${
                activeTab === tab ? 'bg-green-50 text-green-700' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {tab === 'home' && <Home size={24} />}
              {tab === 'history' && <History size={24} />}
              {tab === 'profile' && <User size={24} />}
            </button>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl p-4 md:p-8">

        {activeTab === 'home' && (
          <HomeView
            campaigns={campaigns}
            user={user}
            onSelect={setSelectedCampaign}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView donations={donations} />
        )}

        {activeTab === 'profile' && (
          <ProfileView user={user} donations={donations} />
        )}

      </main>

      {/* DONATION MODAL */}
      {selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onDonate={handleDonate}
          isProcessing={isDonating}
        />
      )}

      {/* MOBILE BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 md:hidden z-20 pb-safe">
        <NavBtn icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavBtn icon={History} label="Harvest" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavBtn icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 w-16 ${active ? 'text-green-700' : 'text-gray-400'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const HomeView = ({ campaigns, user, onSelect }) => {
  const featured = campaigns[0];
  const others = campaigns.slice(1);

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome back, {user?.isAnonymous ? 'Sower' : 'Friend'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          "He who sows bountifully will also reap bountifully."
        </p>
      </header>

      {/* FEATURED CARD (Enhanced) */}
      {featured && (
        <div
          onClick={() => onSelect(featured)}
          className="relative h-72 rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-green-900/10"
        >
          <img
            src={featured.image}
            alt={featured.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-600 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                Ongoing Mission
              </span>
              <span className="bg-white/20 backdrop-blur text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                {featured.category}
              </span>
            </div>

            <h2 className="text-3xl font-bold mb-2">{featured.title}</h2>
            <p className="text-white/90 text-sm mb-6 leading-relaxed max-w-lg">{featured.description}</p>

            <div className="flex items-center gap-3">
              <button className="bg-white text-green-900 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-50 transition-colors">
                <Heart size={16} className="text-green-700 fill-green-700" />
                Sow Seed
              </button>
              <span className="text-xs font-medium text-white/80">Continuous Impact</span>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES / OTHER CAMPAIGNS (Enhanced) */}
      <h3 className="font-bold text-slate-800 text-lg mt-8 mb-2">Impact Areas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {others.map(camp => (
          <Card
            key={camp.id}
            className="flex flex-col h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            onClick={() => onSelect(camp)}
          >
            <div className="h-40 relative overflow-hidden">
              <img src={camp.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={camp.title} />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-xs font-bold px-2.5 py-1.5 rounded-lg text-slate-800 shadow-sm flex items-center gap-1.5">
                {camp.icon && <camp.icon size={12} className="text-green-700" />}
                {camp.category}
              </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-800 text-lg">{camp.title}</h3>
              </div>

              <p className="text-slate-500 text-sm mb-4 flex-1 leading-relaxed">
                {camp.description}
              </p>

              <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                 <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                   Accepting Donations
                 </span>
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-green-700 group-hover:text-white transition-colors text-slate-400">
                   <ChevronRight size={18} />
                 </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const HistoryView = ({ donations }) => {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Your Harvest</h1>
        <p className="text-slate-500 text-sm">Tracking your seeds of kindness.</p>
      </header>

      {donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Sprout size={32} />
          </div>
          <h3 className="text-slate-800 font-medium">No donations yet</h3>
          <p className="text-slate-500 text-sm max-w-xs mt-2">
            Start sowing seeds today to see your harvest grow here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((donation) => (
            <Card key={donation.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-700">
                <Heart size={20} fill="currentColor" className="opacity-20" />
                <Heart size={20} className="absolute" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{donation.campaignTitle}</h4>
                <p className="text-xs text-slate-500">
                  {donation.timestamp ? new Date(donation.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                </p>
              </div>
              <div className="text-right">
                <span className="block font-bold text-green-700">₦{donation.amount.toLocaleString()}</span>
                <span className="text-[10px] uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {donation.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, donations }) => {
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-green-200">
          {user?.isAnonymous ? 'G' : user?.email?.[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{user?.isAnonymous ? 'Guest Sower' : user?.email}</h1>
          <p className="text-green-600 text-sm font-medium">Level 1 Partner</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-amber-50 border-amber-100">
          <div className="text-amber-600 mb-2"><Gift size={24} /></div>
          <div className="text-2xl font-bold text-slate-800">{donations.length}</div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Seeds Sown</div>
        </Card>
        <Card className="p-5 bg-green-50 border-green-100">
          <div className="text-green-600 mb-2"><TrendingUpIcon size={24} /></div>
          <div className="text-2xl font-bold text-slate-800">₦{(totalDonated / 1000).toFixed(1)}k</div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Impact</div>
        </Card>
      </div>

      <div className="bg-slate-100 rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 ml-1">Account</h3>
        <div className="space-y-1">
          <ProfileLink icon={User} label="Personal Information" />
          <ProfileLink icon={CreditCard} label="Payment Methods" />
          <ProfileLink icon={CheckCircle} label="Recurring Seeds" />
          <div className="pt-4 mt-4 border-t border-slate-200">
             <button onClick={() => signOut(auth)} className="w-full text-left px-3 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors">
               Sign Out
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileLink = ({ icon: Icon, label }) => (
  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-slate-900 group">
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-slate-400 group-hover:text-green-600 transition-colors" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400" />
  </button>
);

// --- DONATION FLOW ---

const DonationModal = ({ campaign, onClose, onDonate, isProcessing }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('amount'); // amount, payment

  const PRESETS = [1000, 5000, 10000, 50000];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Sow a Seed</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          <div className="mb-6 flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <img src={campaign.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <div>
              <p className="text-[10px] text-green-700 uppercase font-bold tracking-wider mb-0.5">Sowing Into</p>
              <h4 className="font-bold text-slate-800 leading-tight text-lg">{campaign.title}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">{campaign.description}</p>
            </div>
          </div>

          {step === 'amount' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Amount (NGN)</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PRESETS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        amount === preset.toString()
                          ? 'border-green-600 bg-green-50 text-green-700 shadow-sm ring-1 ring-green-600'
                          : 'border-gray-200 text-slate-600 hover:border-green-300'
                      }`}
                    >
                      ₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Other Amount"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-bold text-slate-800 placeholder:font-normal"
                  />
                </div>
              </div>

              <Button
                onClick={() => setStep('payment')}
                disabled={!amount || Number(amount) < 100}
                className="w-full"
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm">
                 You are about to sow <strong>₦{Number(amount).toLocaleString()}</strong> into the {campaign.title} mission.
               </div>

               <div className="space-y-3">
                 <button
                  onClick={() => onDonate(amount, 'card')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group disabled:opacity-50"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-green-100 group-hover:text-green-600">
                       <CreditCard size={20} />
                     </div>
                     <span className="font-bold text-slate-700">Pay with Card</span>
                   </div>
                   {isProcessing ? <Loader2 className="animate-spin text-green-600" /> : <ChevronRight className="text-slate-300" />}
                 </button>

                 <button
                  onClick={() => onDonate(amount, 'transfer')}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group disabled:opacity-50"
                 >
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-green-100 group-hover:text-green-600">
                       <ArrowRight size={20} className="-rotate-45" />
                     </div>
                     <span className="font-bold text-slate-700">Bank Transfer</span>
                   </div>
                   {isProcessing ? <Loader2 className="animate-spin text-green-600" /> : <ChevronRight className="text-slate-300" />}
                 </button>
               </div>

               <button onClick={() => setStep('amount')} className="w-full py-3 text-slate-500 text-sm font-medium hover:text-slate-800">
                 Back to amount
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple icon for profile view
const TrendingUpIcon = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);
