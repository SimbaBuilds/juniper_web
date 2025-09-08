'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Brain, Loader2 } from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';
import { PublicMobileMenu } from '../components/public-mobile-menu';
import { useAuth } from '../providers/auth-provider';
import type { BlogPost } from '@/lib/tables';

interface BlogPostWithFormattedDate extends Omit<BlogPost, 'published_at' | 'created_at' | 'updated_at'> {
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function BlogPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<BlogPostWithFormattedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blog/posts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        
        const postsData = await response.json();
        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8" style={{color: 'var(--muted-blue)'}} />
            <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
              Juniper
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/integration-descriptions" className="text-foreground hover:text-primary transition-colors">
              Integrations
            </Link>
            <Link href="/blog" className="text-foreground hover:text-primary transition-colors font-semibold">
              Blog
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-4">
              {authLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : user ? (
                <>
                  <span className="text-foreground">{user.email}</span>
                  <Link href="/dashboard">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
            <PublicMobileMenu user={user} loading={authLoading} />
          </div>
        </nav>
      </header>

      {/* Blog Header */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Juniper <span style={{color: 'var(--muted-blue)'}}>Blog</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Insights, updates, and stories about AI-powered wellness and productivity
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading blog posts...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-lg">No blog posts available yet.</div>
            <p className="text-muted-foreground mt-2">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {posts.map((post) => (
              <Card key={post.id} className="h-full flex flex-col hover:shadow-lg transition-shadow bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2 text-foreground">
                    {post.title}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{post.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-muted-foreground mb-6 flex-1 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" className="w-full group">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-16 text-center">
        <div className="text-muted-foreground">
          <p>&copy; 2024 Juniper. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}