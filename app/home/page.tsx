'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, BarChart2, Upload, PieChart, Users, Play } from "lucide-react"
import PricingSection from "../components/PricingSection"
import { getSession } from '@/utils/auth-state';
import { logDebug, logError } from '@/lib/logging';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        if (session) {
          // If authenticated, redirect to dashboard
          logDebug('User authenticated, redirecting from home to dashboard', { userId: session.user?.id });
          router.push('/dashboard');
        }
      } catch (error) {
        logError('Error checking authentication', error, { page: 'home' });
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-blue-600">CarePlan Studio</h1>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/sign-in" className="text-blue-600 font-medium hover:text-blue-800 transition">
              Simulator Tool
            </Link>
            <Link href="#features" className="text-gray-600 hover:text-blue-600 transition">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">
              How It Works
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition">
              Pricing
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin" passHref>
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/auth/signin" passHref>
              <Button>Try For Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Turn Illustrations Into Impact</h1>
              <p className="text-xl text-gray-600 mb-8">
                Upload any LTC policy, simulate outcomes, and show clients exactly how insurance protects their future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signin" passHref>
                  <Button size="lg" className="px-8">
                    Launch Simulator
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#demo" passHref>
                  <Button variant="outline" size="lg">
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="CarePlan Studio Dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-2">Upload. Simulate. Convince.</h2>
          <p className="text-xl opacity-90">From static PDFs to compelling client stories—in seconds.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Advisors Love CarePlan Studio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform transforms how you present long-term care insurance to clients, making complex policies easy
              to understand and compelling to buy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Upload className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Any Carrier, Any Policy</h3>
              <p className="text-gray-600">
                Upload illustrations from Lincoln, Nationwide, OneAmerica, Securian, and more. Our AI extracts all the
                important details automatically.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <BarChart2 className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dynamic Simulations</h3>
              <p className="text-gray-600">
                Show clients what happens if they need care at age 80, if they buy vs. don't buy insurance, or if they
                surrender the policy in 15 years.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <PieChart className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Side-by-Side Comparison</h3>
              <p className="text-gray-600">
                Compare different policies and scenarios to help clients make informed decisions. Show the real impact
                on their retirement assets.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Client-Ready Reports</h3>
              <p className="text-gray-600">
                Generate professional, branded reports that clients can take home. Reinforce your recommendations with
                clear visuals and data.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <CheckCircle className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Close More Cases</h3>
              <p className="text-gray-600">
                Advisors using our platform report higher close rates and larger policy sales. Visual storytelling makes
                the difference.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
              <div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-6">
                <CheckCircle className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Get suggestions on how to position policies, what features to highlight, and how to address common
                client objections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Try the Simulator Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Experience the Simulator Yourself</h2>
            <p className="text-xl text-gray-600 mb-8">
              Our interactive simulator lets you upload policy illustrations, customize scenarios, and visualize the
              impact of long-term care insurance on retirement plans.
            </p>
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <img
                src="/placeholder.svg?height=400&width=800"
                alt="CarePlan Studio Simulator Preview"
                className="w-full h-auto rounded-md mb-6"
              />
              <div className="flex justify-center">
                <Link href="/auth/signin" passHref>
                  <Button size="lg" className="px-8">
                    Launch Simulator Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <p className="text-gray-600">
              No registration required. Try it now with sample data or upload your own policy illustration.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">See CarePlan Studio in Action</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Watch how easy it is to transform complex insurance illustrations into compelling client stories
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-black rounded-lg shadow-2xl overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full p-4 bg-blue-600/20 border-white/30 backdrop-blur-sm"
                >
                  <Play className="h-12 w-12" />
                </Button>
              </div>
              <img
                src="/placeholder.svg?height=720&width=1280"
                alt="CarePlan Studio Demo Video"
                className="w-full h-auto opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From illustration to persuasion in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Upload an Illustration</h3>
              <p className="text-gray-600">PDFs from Lincoln, Nationwide, OneAmerica, Securian, and more.</p>
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="Upload Illustration"
                className="mt-4 mx-auto rounded-lg shadow-md"
              />
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Instantly Parse and Analyze</h3>
              <p className="text-gray-600">
                Our AI extracts every important variable—monthly benefit, death benefit, pool duration, inflation,
                surrender value, and more.
              </p>
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="Parse and Analyze"
                className="mt-4 mx-auto rounded-lg shadow-md"
              />
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Show the Simulation</h3>
              <p className="text-gray-600">
                Walk clients through what happens if they need care at age 80, if they buy vs. don't buy insurance, or
                if they surrender the policy in 15 years.
              </p>
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="Show Simulation"
                className="mt-4 mx-auto rounded-lg shadow-md"
              />
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold mb-3">Tell the Story That Wins Trust</h3>
              <p className="text-gray-600">
                Use toggles, hover features, and charts to turn numbers into understanding.
              </p>
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="Tell the Story"
                className="mt-4 mx-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Advisors Are Saying</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from professionals who've transformed their LTC sales process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-bold">John Doe</h4>
                  <p className="text-gray-600 text-sm">Independent Advisor, Ohio</p>
                </div>
              </div>
              <p className="text-gray-600">
                "After toggling the LTC impact on and off, my skeptical clients said: 'That's what we needed to see.'
                They signed that week for a $100k policy."
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-bold">Sarah Johnson</h4>
                  <p className="text-gray-600 text-sm">RIA, California</p>
                </div>
              </div>
              <p className="text-gray-600">
                "This tool has transformed how I present LTC policies. My close rate has increased by 40% since I
                started using the visual simulations."
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold">MB</span>
                </div>
                <div>
                  <h4 className="font-bold">Michael Brown</h4>
                  <p className="text-gray-600 text-sm">Financial Planner, Texas</p>
                </div>
              </div>
              <p className="text-gray-600">
                "The side-by-side comparison feature helped me show clients why a slightly more expensive policy was
                actually the better value. Worth every penny."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your LTC Conversations?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join hundreds of advisors who are closing more cases with CarePlan Studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin" passHref>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                Launch Simulator Now
              </Button>
            </Link>
            <Link href="/contact" passHref>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-blue-700">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-blue-200">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">CarePlan Studio</h3>
              <p className="mb-4">Helping financial advisors tell better stories about long-term care insurance.</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/sign-in" className="hover:text-white transition">
                    Simulator
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} CarePlan Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

