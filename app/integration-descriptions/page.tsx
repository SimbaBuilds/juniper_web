'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, Mail, MessageSquare, CheckSquare, Video, Search, Cloud, FileText, Grid, Heart, Activity, Link2, Loader2 } from 'lucide-react';
import type { ServiceCategory } from './types';
import { Button } from '@/components/ui/button';

interface ServiceWithTags {
  id: string;
  service_name: string;
  description?: string;
  tags: string[];
  public: boolean;
}

export default function IntegrationDescriptions() {
  const [services, setServices] = useState<ServiceWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/services/public');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const servicesData = await response.json();
        setServices(servicesData);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const getServiceCategory = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    
    // Health and Wellness
    if (['oura', 'fitbit', 'mychart', 'apple health', 'google fit'].includes(name)) {
      return 'Health and Wellness';
    }
    
    // Email
    if (['gmail', 'microsoft outlook email', 'microsoft outlook mail'].includes(name)) {
      return 'Email';
    }
    
    // Communications
    if (['slack', 'microsoft teams', 'twilio', 'textbelt'].includes(name)) {
      return 'Communications';
    }
    
    // Productivity and Task Management
    if (['notion', 'todoist', 'any.do'].includes(name)) {
      return 'Productivity and Task Management';
    }
    
    // Calendar
    if (['google calendar', 'microsoft outlook calendar', 'microsoft calendar'].includes(name)) {
      return 'Calendar';
    }
    
    // Video Conferencing
    if (['google meet'].includes(name)) {
      return 'Video Conferencing';
    }
    
    // Research
    if (['perplexity', 'xai live search'].includes(name)) {
      return 'Research';
    }
    
    // Cloud Storage
    if (['dropbox'].includes(name)) {
      return 'Cloud Storage';
    }
    
    // Cloud Text Documents
    if (['google docs', 'microsoft word online'].includes(name)) {
      return 'Cloud Text Documents';
    }
    
    // Cloud Spreadsheets
    if (['google sheets', 'microsoft excel online'].includes(name)) {
      return 'Cloud Spreadsheets';
    }
    
    return 'Other';
  };

  const getIconForIntegrationType = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    
    if (name === 'fitbit') return <Activity className="w-6 h-6" />;
    if (name === 'oura') return <Heart className="w-6 h-6" />;
    if (name === 'mychart') return <Heart className="w-6 h-6" />;
    if (name === 'apple health') return <Heart className="w-6 h-6" />;
    if (name === 'google fit') return <Activity className="w-6 h-6" />;
    if (['gmail', 'microsoft outlook email', 'microsoft outlook mail'].includes(name)) return <Mail className="w-6 h-6" />;
    if (['google calendar', 'microsoft outlook calendar'].includes(name)) return <Calendar className="w-6 h-6" />;
    if (['slack', 'microsoft teams', 'twilio', 'textbelt'].includes(name)) return <MessageSquare className="w-6 h-6" />;
    if (['notion', 'todoist', 'any.do'].includes(name)) return <CheckSquare className="w-6 h-6" />;
    if (name === 'google meet') return <Video className="w-6 h-6" />;
    if (['perplexity', 'xai live search'].includes(name)) return <Search className="w-6 h-6" />;
    if (name === 'dropbox') return <Cloud className="w-6 h-6" />;
    if (['google docs', 'microsoft word online'].includes(name)) return <FileText className="w-6 h-6" />;
    if (['google sheets', 'microsoft excel online'].includes(name)) return <Grid className="w-6 h-6" />;
    
    return <Link2 className="w-6 h-6" />;
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Health and Wellness':
        return <Heart className="w-5 h-5" />;
      case 'Email':
        return <Mail className="w-5 h-5" />;
      case 'Productivity and Task Management':
        return <CheckSquare className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      case 'Video Conferencing':
        return <Video className="w-5 h-5" />;
      case 'Research':
        return <Search className="w-5 h-5" />;
      case 'Cloud Storage':
        return <Cloud className="w-5 h-5" />;
      case 'Cloud Text Documents':
        return <FileText className="w-5 h-5" />;
      case 'Cloud Spreadsheets':
        return <Grid className="w-5 h-5" />;
      case 'Communications':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <Link2 className="w-5 h-5" />;
    }
  };

  const organizeServicesByCategory = (services: ServiceWithTags[]): ServiceCategory[] => {
    const categoryMap: { [key: string]: ServiceWithTags[] } = {};
    
    services.forEach(service => {
      const category = getServiceCategory(service.service_name);
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(service);
    });
    
    // Define the order of categories with Health and Wellness first, Email second
    const categoryOrder = [
      'Health and Wellness',
      'Email',
      'Communications',
      'Productivity and Task Management',
      'Calendar',
      'Video Conferencing',
      'Cloud Storage',
      'Cloud Text Documents',
      'Cloud Spreadsheets',
      'Research',
      'Other'
    ];
    
    const categories: ServiceCategory[] = [];
    categoryOrder.forEach(categoryName => {
      if (categoryMap[categoryName] && categoryMap[categoryName].length > 0) {
        const sortedServices = categoryMap[categoryName].sort((a, b) => 
          a.service_name.localeCompare(b.service_name)
        );
        categories.push({
          name: categoryName,
          icon: '',
          services: sortedServices
        });
      }
    });
    
    return categories;
  };

  const toggleDescriptionExpansion = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const categorizedServices = organizeServicesByCategory(services);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Available Integrations</h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Connect your favorite services to unlock powerful AI-driven insights and automation. 
            Our integrations allow Juniper to understand your data and provide personalized assistance across all your tools.
          </p>
        </div>

        {categorizedServices.length === 0 ? (
          <div className="text-center py-16">
            <Link2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Integrations Available</h2>
            <p className="text-muted-foreground">Integrations will appear here when they're added to the system.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categorizedServices.map((category) => (
              <div key={category.name} className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="text-primary mr-3">
                    {getCategoryIcon(category.name)}
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">{category.name}</h2>
                  <div className="ml-4 flex-1 h-px bg-border"></div>
                </div>
                
                <div className="grid gap-4">
                  {category.services.map((service) => (
                    <div key={service.id} className="bg-card border border-border rounded-lg p-6 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <div className="text-muted-foreground mr-4 mt-1">
                            {getIconForIntegrationType(service.service_name)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{service.service_name}</h3>
                            {service.tags && service.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {service.tags.map((tag, index) => (
                                  <span key={index} className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {service.description && (
                        <div className="mt-4 border-t border-border pt-4">
                          <button
                            onClick={() => toggleDescriptionExpansion(service.id)}
                            className="flex items-center justify-between w-full text-left group"
                          >
                            <span className="text-sm font-medium text-primary group-hover:text-primary/80 transition-colors">
                              {expandedServices.has(service.id) ? 'Hide Details' : 'Show Details'}
                            </span>
                            {expandedServices.has(service.id) ? (
                              <ChevronUp className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-primary group-hover:text-primary/80 transition-colors" />
                            )}
                          </button>
                          
                          {expandedServices.has(service.id) && (
                            <div className="mt-3">
                              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6">
            Ready to experience Juniper?
          </p>
          <Button asChild size="lg">
            <a href="/signin">
              Get Started
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}