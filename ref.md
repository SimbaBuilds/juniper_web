import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../supabase/supabase';
import { useAuth } from '../auth/AuthContext';
import IntegrationService from './IntegrationService';
import IntegrationEmailService from '../services/IntegrationEmailService';
import TwilioCredentialsModal from './components/TwilioCredentialsModal';
import TextbeltCredentialsModal from './components/TextbeltCredentialsModal';
import { SettingsToggle } from '../settings/components/SettingsToggle';
import { colors } from '../shared/theme/colors';

interface ServiceWithStatus {
  id: string;
  service_name: string;
  tags: string[];
  description?: string;
  isActive: boolean;
  isConnected: boolean;
  integration_id?: string;
  status?: string; // pending, active, etc.
  isPendingSetup?: boolean; // Waiting for online form completion
  isSystemIntegration?: boolean; // Flag for system integrations (based on type field)
  public: boolean; // Whether the service should be displayed publicly
  type: string; // "user" or "system" - from database
}

interface TwilioCredentials {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
  phoneNumber: string;
}

interface TextbeltCredentials {
  phone_number: string;
}

interface ServiceCategory {
  name: string;
  services: ServiceWithStatus[];
}

export const IntegrationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [twilioModalVisible, setTwilioModalVisible] = useState(false);
  const [textbeltModalVisible, setTextbeltModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceWithStatus | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  // Define service categories
  const getServiceCategory = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    
     // Health and Wellness
     if (['oura', 'fitbit'].includes(name)) {
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
    if (['research', 'ai', 'search'].includes(name)) {
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
    
    
    // Default category for uncategorized services
    return 'Other';
  };

  // Organize regular services into categories (excludes system integrations and non-public services)
  const organizeServicesByCategory = (services: ServiceWithStatus[]): ServiceCategory[] => {
    const categoryMap: { [key: string]: ServiceWithStatus[] } = {};
    
    // Filter out system integrations and non-public services from regular categories
    const regularServices = services.filter(service => !service.isSystemIntegration && service.public);
    
    regularServices.forEach(service => {
      const category = getServiceCategory(service.service_name);
      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(service);
    });
    
    // Define the order of categories
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
      'Other'
    ];
    
    // Create sorted categories array
    const categories: ServiceCategory[] = [];
    categoryOrder.forEach(categoryName => {
      if (categoryMap[categoryName] && categoryMap[categoryName].length > 0) {
        // Sort services within each category alphabetically
        const sortedServices = categoryMap[categoryName].sort((a, b) => 
          a.service_name.localeCompare(b.service_name)
        );
        categories.push({
          name: categoryName,
          services: sortedServices
        });
      }
    });
    
    return categories;
  };

  // Get system integrations (only public ones)
  const getSystemIntegrations = (services: ServiceWithStatus[]): ServiceWithStatus[] => {
    return services.filter(service => service.isSystemIntegration && service.public);
  };

  // Helper function to get icon for integration type
  const getIconForIntegrationType = (serviceName: string): keyof typeof Ionicons.glyphMap => {
    switch (serviceName.toLowerCase()) {
      case 'gmail':
      case 'email':
        return 'mail';
      case 'microsoft outlook email':
      case 'microsoft outlook mail':
        return 'mail-outline';
      case 'google calendar':
      case 'microsoft outlook calendar':
        return 'calendar';
      case 'notion':
        return 'document-text';
      case 'slack':
        return 'chatbubbles';
      case 'microsoft teams':
        return 'people';
      case 'trello':
        return 'grid';
      case 'any.do':
      case 'todoist':
        return 'checkbox';
      case 'google meet':
        return 'videocam';
      case 'whatsapp':
        return 'chatbox';
      case 'dropbox':
        return 'cloud';
      case 'perplexity':
        return 'search';
      case 'twitter':
      case 'x':
        return 'logo-twitter';
      case 'google sheets':
      case 'microsoft excel online':
        return 'grid';
      case 'google docs':
      case 'microsoft word online':
        return 'document';
      case 'twilio':
        return 'chatbox-ellipses';
      case 'fitbit':
        return 'fitness';
      case 'oura':
        return 'heart';
      default:
        return 'link';
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
    switch (categoryName) {
      case 'Productivity and Task Management':
        return 'checkbox-outline';
      case 'Calendar':
        return 'calendar-outline';
      case 'Email':
        return 'mail-outline';
      case 'Video Conferencing':
        return 'videocam-outline';
      case 'Research':
        return 'search-outline';
      case 'Cloud Storage':
        return 'cloud-outline';
      case 'Cloud Text Documents':
        return 'document-text-outline';
      case 'Cloud Spreadsheets':
        return 'grid-outline';
      case 'Communications':
        return 'chatbubbles-outline';
      case 'Health and Wellness':
        return 'fitness-outline';
      default:
        return 'apps-outline';
    }
  };

  // Load services and user integrations
  const loadServicesWithStatus = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all services, user integrations, and system integrations in parallel
      const [allServices, userIntegrations, systemIntegrations] = await Promise.all([
        DatabaseService.getAllServicesWithTags(),
        DatabaseService.getIntegrations(user.id),
        DatabaseService.getSystemIntegrations(user.id)
      ]);
      
      // Map services to their status
      const serviceResults = await Promise.all(
        allServices.map(async (service: any) => {
          const serviceName = service.service_name.toLowerCase();
          
          // Check if this is a system integration (based on service type from database)
          if (service.type === 'system') {
            // Map specific system services to their integration keys
            const serviceKeyMap: Record<string, string> = {
              'Perplexity': 'perplexity',
              'Textbelt': 'textbelt',
              'XAI Live Search': 'xai_live_search'
            };
            
            const integrationKey = serviceKeyMap[service.service_name];
            if (!integrationKey) {
              console.warn(`No integration key mapped for system service: ${service.service_name}`);
              return null;
            }
            
            const isActive = systemIntegrations[integrationKey] ?? true; // Default to true for system integrations
            
            return {
              id: service.id,
              service_name: service.service_name,
              tags: service.tagNames || [],
              description: service.description,
              isActive,
              isConnected: isActive,
              integration_id: undefined, // System integrations don't have integration_id
              status: isActive ? 'active' : 'inactive',
              isPendingSetup: false,
              isSystemIntegration: true, // Flag to identify system integrations
              public: service.public, // Use the public field from database
              type: service.type, // Use the type field from database
            };
          }
          
          // Handle regular integrations (type === 'user')
          const integration = userIntegrations.find(
            (int: any) => int.service_id === service.id
          );
          
          const isActive = integration?.is_active;
          let isPendingSetup = false;

          // For API key integrations (Twilio), check if setup is pending
          if (integration && !isActive && 
              ['twilio'].includes(service.service_name.toLowerCase())) {
            try {
              const emailService = IntegrationEmailService.getInstance();
              const integrationStatus = await emailService.getIntegrationStatus(integration.id);
              isPendingSetup = integrationStatus.hasPendingToken || false;
            } catch (error) {
              console.error('Error checking integration status:', error);
            }
          }
          
          return {
            id: service.id,
            service_name: service.service_name,
            tags: service.tagNames || [],
            description: service.description,
            isActive: !!isActive,
            isConnected: !!isActive,
            integration_id: integration?.id,
            status: integration?.status,
            isPendingSetup,
            isSystemIntegration: false, // Regular OAuth integrations
            public: service.public, // Use the public field from database
            type: service.type, // Use the type field from database
          };
        })
      );
      
      // Filter out null results for system services without mapped integration keys
      const servicesWithStatus: ServiceWithStatus[] = serviceResults.filter(Boolean) as ServiceWithStatus[];
      
      setServices(servicesWithStatus);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map service names (same as in IntegrationService)
  const mapServiceName = (dbServiceName: string): string => {
    const serviceMap: Record<string, string> = {
      'Notion': 'notion',
      'Slack': 'slack',
      'Perplexity': 'perplexity',
      'Google Sheets': 'google-sheets',
      'Google Docs': 'google-docs',
      'Gmail': 'gmail',
      'Google Calendar': 'google-calendar',
      'Microsoft Excel Online': 'microsoft-excel',
      'Microsoft Word Online': 'microsoft-word',
      'Microsoft Outlook Calendar': 'microsoft-outlook-calendar',
      'Microsoft Outlook Mail': 'microsoft-outlook-mail',
      'Microsoft Teams': 'microsoft-teams',
      'Twilio': 'twilio',
      'Todoist': 'todoist'
    };
    
    return serviceMap[dbServiceName] || dbServiceName.toLowerCase().replace(/\s+/g, '-');
  };

  // Handle connect button press
  const handleConnect = async (service: ServiceWithStatus) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      console.log('🔗 Connecting to service:', service.service_name);
      
      // Map service name to internal format
      const internalServiceName = mapServiceName(service.service_name);
      console.log('🔗 Mapped service name:', internalServiceName);
      
      // Initialize integration service
      const integrationService = IntegrationService.getInstance();
      
      // Check if this service is a system-managed service (no auth required)
      if (service.type === 'system') {
        // This should now be handled by handleSystemIntegrationToggle instead
        console.warn('System integration toggle should use handleSystemIntegrationToggle');
        return;
      }

      // Check if this service uses Twilio credentials
      if (internalServiceName === 'twilio') {
        // Ensure integration record exists for email functionality
        if (!service.integration_id) {
          const integration = await integrationService.createIntegrationRecord(service.id, user.id);
          service.integration_id = integration.id;
        }
        setSelectedService(service);
        setTwilioModalVisible(true);
        return;
      }

      // Check if this service uses textbelt credentials
      if (internalServiceName === 'textbelt') {
        // Ensure integration record exists for email functionality
        if (!service.integration_id) {
          const integration = await integrationService.createIntegrationRecord(service.id, user.id);
          service.integration_id = integration.id;
        }
        setSelectedService(service);
        setTextbeltModalVisible(true);
        return;
      }
      
      // All other services use OAuth - the IntegrationService will handle the supported check
      // Start the integration flow
      await integrationService.startIntegration({
        serviceId: service.id,
        serviceName: service.service_name,
        userId: user.id
      });

      // Refresh the services list to show updated status
      await loadServicesWithStatus();

    } catch (error) {
      console.error('Error connecting service:', error);
      Alert.alert('Error', 'Failed to connect service. Please try again.');
    }
  };


  // Handle Twilio credentials submission
  const handleTwilioCredentialsSubmit = async (credentials: TwilioCredentials) => {
    try {
      if (!selectedService || !user?.id) {
        throw new Error('Missing service or user information');
      }

      console.log('🔑 Submitting Twilio credentials...');

      const integrationService = IntegrationService.getInstance();
      await integrationService.startTwilioIntegration({
        serviceId: selectedService.id,
        serviceName: selectedService.service_name,
        userId: user.id,
        credentials: credentials
      });

      // Refresh the services list to show updated status
      await loadServicesWithStatus();

    } catch (error) {
      console.error('Error submitting Twilio credentials:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to connect: ${errorMessage}`);
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle textbelt credentials submission
  const handleTextbeltCredentialsSubmit = async (credentials: TextbeltCredentials) => {
    try {
      if (!selectedService || !user?.id) {
        throw new Error('Missing service or user information');
      }

      console.log('🔑 Submitting textbelt credentials...');

      const integrationService = IntegrationService.getInstance();
      await integrationService.startTextbeltIntegration({
        serviceId: selectedService.id,
        serviceName: selectedService.service_name,
        userId: user.id,
        credentials: credentials
      });

      // Refresh the services list to show updated status
      await loadServicesWithStatus();

    } catch (error) {
      console.error('Error submitting textbelt credentials:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to connect: ${errorMessage}`);
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle finalize integration
  const handleFinalizeIntegration = async (service: ServiceWithStatus) => {
    try {
      if (!service.integration_id) {
        Alert.alert('Error', 'No integration ID found.');
        return;
      }

      // Check if the integration is ready for finalization
      const emailService = IntegrationEmailService.getInstance();
      const isReady = await emailService.checkIntegrationReadyForFinalization(service.integration_id);

      if (!isReady) {
        Alert.alert(
          'Setup Not Complete',
          'Please complete the setup form that was sent to your email first, then try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Complete the integration
      const integrationService = IntegrationService.getInstance();
      
      // Update integration status to active
      await integrationService.updateIntegrationStatus(service.integration_id, 'active', true);

      Alert.alert(
        'Integration Complete! ✅',
        `Your ${service.service_name} integration is now active and ready to use.`,
        [{ text: 'Great!' }]
      );

      // Refresh the services list
      await loadServicesWithStatus();

    } catch (error) {
      console.error('Error finalizing integration:', error);
      Alert.alert('Error', 'Failed to finalize integration. Please try again.');
    }
  };

  // Handle toggle description expansion
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

  // Handle system integration toggle
  const handleSystemIntegrationToggle = async (service: ServiceWithStatus, enabled: boolean) => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated. Please log in again.');
        return;
      }

      console.log(`🔧 Toggling system integration: ${service.service_name} to ${enabled}`);
      
      // Map specific system services to their integration keys
      const serviceKeyMap: Record<string, string> = {
        'Perplexity': 'perplexity',
        'Textbelt': 'textbelt',
        'XAI Live Search': 'xai_live_search'
      };
      
      const integrationKey = serviceKeyMap[service.service_name];
      if (!integrationKey) {
        Alert.alert('Error', `No integration key mapped for system service: ${service.service_name}`);
        return;
      }
      
      await DatabaseService.updateSystemIntegration(user.id, integrationKey, enabled);
      
      // Refresh the services list
      await loadServicesWithStatus();
      
    } catch (error) {
      console.error('Error toggling system integration:', error);
      Alert.alert('Error', 'Failed to update integration. Please try again.');
    }
  };

  // Handle reconnect button press
  const handleReconnect = async (service: ServiceWithStatus) => {
    try {
      if (!service.integration_id) {
        Alert.alert('Error', 'No integration ID found.');
        return;
      }

      Alert.alert(
        'Reconnect Integration',
        `Are you sure you want to reconnect ${service.service_name}? This will start a new authentication flow.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reconnect', 
            onPress: async () => {
              const integrationService = IntegrationService.getInstance();
              await integrationService.reconnectIntegration(
                service.integration_id!,
                service.service_name
              );
              
              // Refresh the services list
              await loadServicesWithStatus();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error reconnecting service:', error);
      Alert.alert('Error', 'Failed to reconnect service. Please try again.');
    }
  };

  // Handle disconnect button press
  const handleDisconnect = async (service: ServiceWithStatus) => {
    try {
      if (!service.integration_id) {
        Alert.alert('Error', 'No integration ID found.');
        return;
      }

      Alert.alert(
        'Disconnect Integration',
        `Are you sure you want to disconnect ${service.service_name}? This will revoke access and you'll need to reconnect to use this service again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disconnect', 
            style: 'destructive',
            onPress: async () => {
              const integrationService = IntegrationService.getInstance();
              await integrationService.disconnectIntegration(
                service.integration_id!,
                service.service_name
              );
              
              // Refresh the services list
              await loadServicesWithStatus();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error disconnecting service:', error);
      Alert.alert('Error', 'Failed to disconnect service. Please try again.');
    }
  };

  // Effects
  useEffect(() => {
    loadServicesWithStatus();
  }, [user?.id]);

  // Refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadServicesWithStatus();
    }, [user?.id])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading integrations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadServicesWithStatus}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categorizedServices = organizeServicesByCategory(services);
  const systemIntegrations = getSystemIntegrations(services);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          {/* <Text style={styles.title}>Integrations</Text> */}
          <Text style={styles.subtitle}>
            Integrations below can take up to 3 minutes each to complete.
          </Text>
        </View>

        <View style={styles.servicesSection}>
          {categorizedServices.map((category) => (
            <View key={category.name} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Ionicons 
                  name={getCategoryIcon(category.name)} 
                  size={20} 
                  color="#4A90E2" 
                />
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <View style={styles.categoryDivider} />
              </View>
              
              <View style={styles.categoryServices}>
                {category.services.map((service) => (
                  <View key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceLeft}>
                        <Ionicons 
                          name={getIconForIntegrationType(service.service_name)} 
                          size={24} 
                          color={service.isConnected ? "#4CAF50" : "#666666"} 
                        />
                        <View style={styles.serviceInfo}>
                          <Text style={styles.serviceName}>{service.service_name}</Text>
                          {service.tags && service.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                              {service.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                  <Text style={styles.tagText}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.serviceRight}>
                        {service.isConnected ? (
                          <View style={styles.connectedContainer}>
                            <View style={styles.connectedIndicator}>
                              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                              <Text style={styles.connectedText}>Connected</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.reconnectButton}
                              onPress={() => handleReconnect(service)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.reconnectButtonText}>Reconnect</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.disconnectButton}
                              onPress={() => handleDisconnect(service)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.disconnectButtonText}>Disconnect</Text>
                            </TouchableOpacity>
                          </View>
                        ) : service.isPendingSetup ? (
                          <View style={styles.pendingContainer}>
                            <View style={styles.pendingIndicator}>
                              <Ionicons name="hourglass" size={16} color="#FF9800" />
                              <Text style={styles.pendingText}>Setup In Progress</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.finalizeButton}
                              onPress={() => handleFinalizeIntegration(service)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.finalizeButtonText}>Finalize Integration</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.connectButton}
                            onPress={() => handleConnect(service)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.connectButtonText}>Connect</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    
                    {/* Description section - expandable */}
                    {service.description && (
                      <View style={styles.descriptionSection}>
                        <TouchableOpacity
                          style={styles.descriptionToggle}
                          onPress={() => toggleDescriptionExpansion(service.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.descriptionToggleText}>
                            {expandedServices.has(service.id) ? 'Hide Details' : 'Show Details'}
                          </Text>
                          <Ionicons 
                            name={expandedServices.has(service.id) ? 'chevron-up' : 'chevron-down'} 
                            size={16} 
                            color="#4A90E2" 
                          />
                        </TouchableOpacity>
                        
                        {expandedServices.has(service.id) && (
                          <View style={styles.descriptionContent}>
                            <Text style={styles.descriptionText}>{service.description}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* System Integrations Section */}
        {systemIntegrations.length > 0 && (
          <View style={styles.systemIntegrationsSection}>
            <View style={styles.systemIntegrationsHeader}>
              <Ionicons name="settings-outline" size={20} color="#4A90E2" />
              <Text style={styles.systemIntegrationsTitle}>System Integrations</Text>
              <View style={styles.categoryDivider} />
            </View>
            <Text style={styles.systemIntegrationsDescription}>
              Built-in services that don't require separate authentication
            </Text>
            
            <View style={styles.systemIntegrationsServices}>
              {systemIntegrations.map((service) => (
                <View key={service.id} style={styles.systemServiceCard}>
                  <View style={styles.systemServiceHeader}>
                    <View style={styles.systemServiceLeft}>
                      <Ionicons 
                        name={getIconForIntegrationType(service.service_name)} 
                        size={24} 
                        color={service.isActive ? "#4A90E2" : "#666666"} 
                      />
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.service_name}</Text>
                        <Text style={styles.systemServiceDescription}>
                          Gives Juniper advanced research capabilities
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.systemServiceRight}>
                      <SettingsToggle
                        label=""
                        value={service.isActive}
                        onValueChange={(enabled) => handleSystemIntegrationToggle(service, enabled)}
                        description=""
                      />
                    </View>
                  </View>
                  
                  {/* Description section - expandable */}
                  {service.description && (
                    <View style={styles.descriptionSection}>
                      <TouchableOpacity
                        style={styles.descriptionToggle}
                        onPress={() => toggleDescriptionExpansion(service.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.descriptionToggleText}>
                          {expandedServices.has(service.id) ? 'Hide Details' : 'Show Details'}
                        </Text>
                        <Ionicons 
                          name={expandedServices.has(service.id) ? 'chevron-up' : 'chevron-down'} 
                          size={16} 
                          color="#4A90E2" 
                        />
                      </TouchableOpacity>
                      
                      {expandedServices.has(service.id) && (
                        <View style={styles.descriptionContent}>
                          <Text style={styles.descriptionText}>{service.description}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {services.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="apps-outline" size={48} color="#666666" />
            <Text style={styles.emptyStateText}>No services available</Text>
            <Text style={styles.emptyStateSubtext}>
              Services will appear here when they're added to the database
            </Text>
          </View>
        )}
      </ScrollView>


      {/* Twilio Credentials Modal */}
      <TwilioCredentialsModal
        visible={twilioModalVisible}
        integrationId={selectedService?.integration_id}
        onClose={() => {
          setTwilioModalVisible(false);
          setSelectedService(null);
        }}
        onSuccess={() => {
          setTwilioModalVisible(false);
          setSelectedService(null);
        }}
        onSubmit={handleTwilioCredentialsSubmit}
        onEmailSent={() => {
          // Handle email sent - set service to pending setup state
          loadServicesWithStatus();
        }}
      />

      {/* Textbelt Credentials Modal */}
      <TextbeltCredentialsModal
        visible={textbeltModalVisible}
        integrationId={selectedService?.integration_id}
        onClose={() => {
          setTextbeltModalVisible(false);
          setSelectedService(null);
        }}
        onSuccess={() => {
          setTextbeltModalVisible(false);
          setSelectedService(null);
        }}
        onSubmit={handleTextbeltCredentialsSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B0B0B0',
    lineHeight: 22,
  },
  servicesSection: {
    gap: 24,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  categoryDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#2A2A2A',
    marginLeft: 12,
  },
  categoryServices: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  serviceInfo: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  tagText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  connectedContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  connectButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  reconnectButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginBottom: 6,
  },
  reconnectButtonText: {
    color: '#4A90E2',
    fontSize: 12,
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  disconnectButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  pendingContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  finalizeButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  // System Integrations Section Styles
  systemIntegrationsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  systemIntegrationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  systemIntegrationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
  },
  systemIntegrationsDescription: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 16,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  systemIntegrationsServices: {
    gap: 12,
  },
  systemServiceCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  systemServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  systemServiceRight: {
    marginLeft: 16,
  },
  systemServiceDescription: {
    fontSize: 13,
    color: '#B0B0B0',
    marginTop: 4,
    lineHeight: 18,
  },
  // Description expansion styles
  descriptionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  descriptionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  descriptionToggleText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  descriptionContent: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
}); 