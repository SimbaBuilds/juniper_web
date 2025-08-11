interface ServiceWithTags {
  id: string;
  service_name: string;
  description?: string;
  tags: string[];
  public: boolean;
}

export interface ServiceCategory {
  name: string;
  icon: string;
  services: ServiceWithTags[];
}