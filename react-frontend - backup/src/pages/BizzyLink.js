import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ServerIcon, 
  CommandLineIcon, 
  CpuChipIcon, 
  CodeBracketIcon, 
  ShieldCheckIcon, 
  CubeTransparentIcon,
  ArrowPathIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const BizzyLink = () => {
  const [renderTime, setRenderTime] = useState(null);
  const [serverLoad, setServerLoad] = useState(Math.floor(Math.random() * 25) + 5);
  const [systemUptime, setSystemUptime] = useState(Math.floor(Math.random() * 500) + 200);
  const [activeUsers, setActiveUsers] = useState(Math.floor(Math.random() * 100) + 50);
  const [memoryUsage, setMemoryUsage] = useState(Math.floor(Math.random() * 30) + 10);
  const [currentVersion, setCurrentVersion] = useState("0.1.5");
  const [cpuCores, setCpuCores] = useState(Math.floor(Math.random() * 4) + 4);
  const renderStartTime = useRef(Date.now());
  const terminalRef = useRef(null);
  const [terminalText, setTerminalText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const bootSequence = [
    'Initializing BizzyLink system v0.1.5...',
    'Starting core services...',
    'Loading Minecraft API connector...',
    'Establishing database connection...',
    'Verifying security protocols...',
    'Syncing with BizzyNATION master server...',
    'Checking system integrity...',
    'Initializing web interface...',
    'All systems operational.',
    'Welcome to BizzyLink - Account Linking System by Bizzy'
  ];
  
  // Simulate server stats changes
  useEffect(() => {
    // Measure initial render time
    const endTime = Date.now();
    setRenderTime(endTime - renderStartTime.current);
    
    // Update system stats at random intervals to simulate real activity
    const loadInterval = setInterval(() => {
      setServerLoad(Math.floor(Math.random() * 25) + 5);
      setMemoryUsage(Math.floor(Math.random() * 30) + 10);
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and +5
        return Math.max(30, prev + change); // Ensure at least 30 users
      });
      setSystemUptime(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(loadInterval);
  }, []);
  
  // Terminal animation effect
  useEffect(() => {
    let currentLine = 0;
    let currentText = '';
    let timerId;
    
    const typeNextLine = () => {
      if (currentLine < bootSequence.length) {
        const line = bootSequence[currentLine];
        
        // Type each character with a small delay
        let charIndex = 0;
        const typeChar = () => {
          if (charIndex < line.length) {
            currentText += line.charAt(charIndex);
            setTerminalText(currentText);
            charIndex++;
            setCursorPosition(currentText.length);
            setTimeout(typeChar, 20 + Math.random() * 50); // Random typing speed
          } else {
            // Line completed, add new line and delay before next line
            currentText += '\n';
            setTerminalText(currentText);
            currentLine++;
            setCursorPosition(currentText.length);
            timerId = setTimeout(typeNextLine, 500);
          }
        };
        
        typeChar();
      }
    };
    
    // Start the animation after a short delay
    timerId = setTimeout(typeNextLine, 500);
    
    return () => clearTimeout(timerId);
  }, []);
  
  return (
    <div className="min-h-screen pt-16 bg-minecraft-navy flex flex-col">
      <div className="py-8 bg-minecraft-navy-dark relative">
        <div className="absolute inset-0 minecraft-grid-bg opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-mono text-minecraft-green mb-4 inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="block tracking-tight font-extrabold">
                <span className="inline bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-400">BizzyLink</span>
                <span className="inline text-sm ml-1 font-mono text-gray-400">v{currentVersion}</span>
              </span>
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-transparent rounded-full mt-2"></div>
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-300 max-w-3xl mx-auto font-mono"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              A highly optimized system for connecting Minecraft identities with web platforms
            </motion.p>
          </div>
        </div>
      </div>
      
      {/* Console output section */}
      <section className="py-8 bg-minecraft-navy-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-green-500/30">
            <div className="bg-gray-800 px-4 py-2 flex items-center">
              <div className="flex space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-gray-400 text-sm font-mono">BizzyLink System Console</div>
            </div>
            <div 
              ref={terminalRef} 
              className="bg-black p-4 font-mono text-sm overflow-auto max-h-80 text-green-400"
            >
              <pre className="whitespace-pre-wrap">{terminalText}</pre>
              <span className={`inline-block h-5 w-2 bg-green-500 ml-1 ${cursorPosition % 2 === 0 ? 'opacity-100' : 'opacity-0'}`}></span>
            </div>
          </div>
        </div>
      </section>
      
      {/* System stats section */}
      <section className="py-12 bg-minecraft-navy relative">
        <div className="absolute inset-0 minecraft-grid-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="mb-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-mono text-minecraft-green">
              <CommandLineIcon className="inline-block h-8 w-8 mr-2 text-emerald-500" />
              System Metrics
            </h2>
            <p className="mt-2 text-gray-400 font-mono">Real-time performance data</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Core Processes"
              value={cpuCores}
              unit="active"
              icon={<CpuChipIcon className="h-6 w-6" />}
              color="blue"
              delay={0}
            />
            <StatCard 
              title="System Uptime"
              value={systemUptime}
              unit="hours"
              icon={<ArrowPathIcon className="h-6 w-6" />}
              color="green"
              delay={0.1}
            />
            <StatCard 
              title="Active Users"
              value={activeUsers}
              unit="connected"
              icon={<ServerIcon className="h-6 w-6" />}
              color="purple"
              delay={0.2}
            />
            <StatCard 
              title="Memory Usage"
              value={memoryUsage}
              unit="%"
              icon={<CubeTransparentIcon className="h-6 w-6" />}
              color="yellow"
              delay={0.3}
            />
          </div>
          
          {/* Live metrics */}
          <div className="mt-12 bg-gray-900/50 rounded-lg p-6 backdrop-blur-sm border border-green-500/20">
            <h3 className="text-xl text-green-400 font-mono mb-4 flex items-center">
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              Live Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-black/30 p-3 rounded-md">
                <div className="text-gray-400 mb-1 font-mono">RENDERED IN:</div>
                <div className="text-green-400 font-mono text-lg">{renderTime}ms</div>
              </div>
              <div className="bg-black/30 p-3 rounded-md">
                <div className="text-gray-400 mb-1 font-mono">SERVER LOAD:</div>
                <div className="flex items-center">
                  <span className={`font-mono text-lg ${serverLoad > 20 ? 'text-orange-400' : 'text-green-400'}`}>{serverLoad}%</span>
                  <div className="ml-2 h-2 w-16 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${serverLoad > 20 ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${serverLoad}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-black/30 p-3 rounded-md">
                <div className="text-gray-400 mb-1 font-mono">LOCATION:</div>
                <div className="text-blue-400 font-mono text-lg">eu-west-1</div>
              </div>
              <div className="bg-black/30 p-3 rounded-md">
                <div className="text-gray-400 mb-1 font-mono">RESPONSE TIME:</div>
                <div className="text-green-400 font-mono text-lg">{Math.floor(Math.random() * 30) + 10}ms</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About BizzyLink section */}
      <section className="py-16 bg-minecraft-navy-dark relative">
        <div className="absolute inset-0 minecraft-grid-bg opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.h2 
              className="text-3xl font-mono text-minecraft-green mb-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CodeBracketIcon className="inline-block h-8 w-8 mr-2 text-emerald-500" />
              The BizzyLink System
            </motion.h2>
            
            <div className="space-y-12 text-gray-300">
              <FeatureSection 
                title="Designed by Bizzy for BizzyNATION™" 
                icon={<ServerIcon className="h-6 w-6" />}
                delay={0}
              >
                <p className="mb-4">
                  BizzyLink was created from the ground up by Bizzy himself as a custom solution for the BizzyNATION™ server. 
                  Every line of code was crafted with performance and security in mind, ensuring a seamless connection between 
                  Minecraft identities and our web platform.
                </p>
                <p>
                  The system was built to handle the specific needs of our growing Minecraft community, with a strong focus on 
                  scalability and maintaining a consistent user experience even during peak server loads.
                </p>
              </FeatureSection>
              
              <FeatureSection 
                title="Technical Architecture" 
                icon={<CpuChipIcon className="h-6 w-6" />}
                delay={0.1}
              >
                <p className="mb-4">
                  Built on a microservices architecture, BizzyLink utilizes a combination of React for the frontend and a 
                  Node.js/Express backend with a MongoDB database. The system communicates with Minecraft servers through 
                  a custom-built API that interfaces with server plugins.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6 font-mono text-sm">
                  <div className="bg-black/30 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">FRONTEND:</div>
                    <div className="text-green-400">React + Framer Motion</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">BACKEND:</div>
                    <div className="text-green-400">Node.js + Express</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">DATABASE:</div>
                    <div className="text-green-400">MongoDB Atlas</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-md">
                    <div className="text-gray-400 mb-1">MC INTERFACE:</div>
                    <div className="text-green-400">Custom Spigot Plugin</div>
                  </div>
                </div>
              </FeatureSection>
              
              <FeatureSection 
                title="Security First Approach" 
                icon={<ShieldCheckIcon className="h-6 w-6" />}
                delay={0.2}
              >
                <p className="mb-4">
                  Security is at the core of BizzyLink's design philosophy. The system employs multiple layers of protection:
                </p>
                <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>JWT-based authentication with automatic token rotation</li>
                  <li>HTTPS-only communication with perfect forward secrecy</li>
                  <li>Account verification through one-time verification codes</li>
                  <li>Rate limiting to prevent brute force attacks</li>
                  <li>Comprehensive logging for security audits</li>
                </ul>
                <p className="text-sm font-mono bg-black/30 p-3 rounded-md border-l-2 border-green-500">
                  "Security isn't just a feature, it's the foundation of trust between our users and the platform."<br />
                  <span className="text-green-500">- Bizzy, Lead Developer</span>
                </p>
              </FeatureSection>
            </div>
          </div>
        </div>
      </section>
      
      {/* Technical design section */}
      <section className="py-16 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
          <div className="absolute inset-0 matrix-bg"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl font-mono text-minecraft-green mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Design Philosophy
            </motion.h2>
            <motion.p 
              className="text-gray-400 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              The core principles that guided the development of BizzyLink
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PhilosophyCard 
              title="Performance"
              description="Optimized for speed at every level, from database queries to frontend rendering."
              iconColor="green"
              delay={0}
            />
            <PhilosophyCard 
              title="Reliability"
              description="Built with redundancy and failover mechanisms to ensure 99.9% uptime."
              iconColor="blue"
              delay={0.1}
            />
            <PhilosophyCard 
              title="Scalability"
              description="Designed to grow seamlessly with the BizzyNATION™ community, from hundreds to thousands of users."
              iconColor="purple"
              delay={0.2}
            />
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-green-500 font-mono text-lg">&lt;/&gt;</p>
            <div className="mt-4 text-gray-500 font-mono">
              <p>BizzyLink v{currentVersion} | A BizzyNATION™ Technology</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Statistic Card Component
const StatCard = ({ title, value, unit, icon, color, delay = 0 }) => {
  const colors = {
    blue: "from-blue-500 to-cyan-400",
    green: "from-green-500 to-emerald-400",
    purple: "from-purple-500 to-indigo-400",
    yellow: "from-yellow-500 to-amber-400"
  };
  
  return (
    <motion.div 
      className="bg-gray-900/60 rounded-lg overflow-hidden backdrop-blur-sm border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-400 font-mono text-sm">{title.toUpperCase()}</div>
          <div className={`p-2 rounded-full bg-gradient-to-r ${colors[color]} bg-opacity-20`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end space-x-2">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-gray-400 mb-1">{unit}</div>
        </div>
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors[color]}`}
            style={{ width: `${Math.min(100, value)}%` }}
          ></div>
        </div>
      </div>
    </motion.div>
  );
};

// Feature Section Component
const FeatureSection = ({ title, children, icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-900/40 p-6 rounded-lg"
    >
      <h3 className="text-xl text-green-400 font-mono mb-4 flex items-center">
        <span className="text-emerald-500 mr-3">{icon}</span>
        {title}
      </h3>
      <div className="text-gray-300">
        {children}
      </div>
    </motion.div>
  );
};

// Philosophy Card Component
const PhilosophyCard = ({ title, description, iconColor, delay = 0 }) => {
  return (
    <motion.div 
      className="bg-gray-900/30 rounded-lg overflow-hidden border border-gray-800 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className={`text-${iconColor}-500 font-mono text-3xl mb-2`}>&lt;/&gt;</div>
      <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

export default BizzyLink; 