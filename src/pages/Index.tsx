import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Shield, TrendingUp, Wallet, Zap, Star, Users, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
                CryptoGrow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="premium" className="shadow-glow">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-crypto opacity-5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-crypto-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-crypto-gold/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 100,000+ investors worldwide
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-heading mb-6 leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Grow Your Wealth
            </span>
            <br />
            with Premium Crypto
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Join the next generation of cryptocurrency investors. Advanced trading tools, 
            secure wallet management, and expert insights to maximize your returns.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/auth">
              <Button variant="crypto" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                Start Investing <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
              Watch Demo <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-green mb-2">+247%</div>
              <div className="text-muted-foreground">Average Returns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-blue mb-2">100K+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-crypto-gold mb-2">$2.5B+</div>
              <div className="text-muted-foreground">Assets Managed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-4">
              Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">CryptoGrow</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for serious investors who demand premium tools and unmatched security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Bank-Grade Security</h3>
              <p className="text-muted-foreground">
                Multi-layer encryption, cold storage, and advanced security protocols to protect your investments.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Real-time market data, technical indicators, and AI-powered insights for smarter trading decisions.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-crypto rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Wallet</h3>
              <p className="text-muted-foreground">
                Intelligent portfolio management with automated rebalancing and risk optimization.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Execute trades in milliseconds with our high-performance trading engine and direct exchange connections.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Expert Support</h3>
              <p className="text-muted-foreground">
                24/7 premium support from crypto experts and dedicated account managers for high-value clients.
              </p>
            </Card>

            <Card className="p-8 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow group">
              <div className="w-12 h-12 bg-gradient-crypto rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Proven Returns</h3>
              <p className="text-muted-foreground">
                Track record of consistent outperformance with transparent reporting and verified results.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-crypto opacity-10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-6">
            Ready to <span className="bg-gradient-primary bg-clip-text text-transparent">Transform</span> Your Portfolio?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of successful investors who have already discovered the power of premium crypto investing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="crypto" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-heading bg-gradient-primary bg-clip-text text-transparent">
              CryptoGrow
            </span>
          </div>
          <p className="text-muted-foreground mb-6">
            The future of cryptocurrency investing starts here.
          </p>
          <p className="text-sm text-muted-foreground">
            © 2024 CryptoGrow. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;