import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Upload, ChevronDown, DollarSign, 
  PieChart, TrendingUp, Sparkles, LucideIcon,
  HelpCircle, ExternalLink, Download
} from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface EmptyStateProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white bg-opacity-60 rounded-xl p-6 flex items-start space-x-4 
      shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 
      hover:bg-opacity-90 transition-all duration-300"
  >
    <div className="rounded-lg bg-indigo-100 p-3">
      <Icon className="w-6 h-6 text-indigo-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const EmptyState: React.FC<EmptyStateProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState<'help' | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const syntheticEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      onFileUpload(syntheticEvent);
    }
  };

  const handleUploadClick = () => {
    const uploadInput = document.getElementById('file-upload') as HTMLInputElement;
    if (uploadInput) {
      uploadInput.click();
    }
  };

  const handleSampleDataDownload = () => {
    const sampleData = `/sample-transactions.csv`;
    const link = document.createElement('a');
    link.href = sampleData;
    link.download = 'sample-transactions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-indigo-900 mb-4">
          Understand Your Spending Data
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your bank transactions and get instant insights into your spending patterns
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid gap-6 mb-12"
      >
        <div className="relative">
          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
              scale: isDragging ? 1.02 : 1,
              borderColor: isDragging ? '#818CF8' : '#E5E7EB'
            }}
            className={`
              flex flex-col items-center justify-center p-16
              bg-gradient-to-b from-white to-gray-50
              border-2 border rounded-2xl
              ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200'}
              transition-all duration-200 cursor-pointer
              hover:border-indigo-200 hover:bg-indigo-50/30
            `}
          >
            <div className="bg-indigo-100 rounded-full p-5 mb-6">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Drop your CSV file here
            </h2>
            <p className="text-gray-500 mb-6">
              or click to browse from your computer
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={onFileUpload}
              accept=".csv"
              multiple
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-medium 
                hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                focus:ring-offset-2 transition-colors duration-200"
              onClick={handleUploadClick}
            >
              Select CSV File
            </motion.button>
          </motion.div>
          
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-4">
            <div className="bg-green-50 border border-green-200 rounded-full py-2 px-4 
              flex items-center space-x-2 shadow-sm">
              <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm whitespace-nowrap">
                Your data is processed locally*
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSampleDataDownload}
              className="bg-orange-50 border border-orange-200 rounded-full py-2 px-4 
                flex items-center space-x-2 shadow-sm hover:bg-orange-100 transition-colors duration-200"
            >
              <Download className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="text-orange-800 text-sm whitespace-nowrap">
                Try with sample data
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid md:grid-cols-2 gap-6 mb-12"
      >
        <FeatureCard
          icon={PieChart}
          title="Visual Insights"
          description="See your spending patterns through beautiful, interactive charts and graphs"
        />
        <FeatureCard
          icon={TrendingUp}
          title="Spending Trends"
          description="Track how your spending evolves over time with detailed trend analysis"
        />
        <FeatureCard
          icon={DollarSign}
          title="Category Analysis"
          description="Understand exactly where your money goes with detailed category breakdowns"
        />
        <FeatureCard
          icon={Sparkles}
          title="AI Powered"
          description="Get personalized insights and recommendations based on your spending habits"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl overflow-hidden"
      >
        <motion.div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/30 transition-colors duration-200"
          onClick={() => setActiveSection(activeSection === 'help' ? null : 'help')}
        >
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              How to Get Started
            </h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
            activeSection === 'help' ? 'rotate-180' : ''
          }`} />
        </motion.div>

        <AnimatePresence>
          {activeSection === 'help' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-indigo-100"
            >
              <div className="p-6 bg-white/40">
                <div className="text-sm text-gray-600 space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Download your transactions:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      <li className="flex items-baseline space-x-2">
                        <span>1.</span>
                        <span>Log into your online banking</span>
                      </li>
                      <li className="flex items-baseline space-x-2">
                        <span>2.</span>
                        <span>Navigate to your account transactions</span>
                      </li>
                      <li className="flex items-baseline space-x-2">
                        <span>3.</span>
                        <span>Look for an "Export" or "Download" option</span>
                      </li>
                      <li className="flex items-baseline space-x-2">
                        <span>4.</span>
                        <span>Select CSV format and your date range</span>
                      </li>
                      <li className="flex items-baseline space-x-2">
                        <span>5.</span>
                        <span>Upload the downloaded file here</span>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800 flex items-center">
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                      Supported banks: Chase, American Express, Capital One and more
                    </p>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default EmptyState;