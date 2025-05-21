import { 
  users, 
  products, 
  onboardingRequests, 
  contactMessages, 
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type OnboardingRequest,
  type InsertOnboardingRequest,
  type ContactMessage,
  type InsertContactMessage
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  clearProducts(): Promise<void>;
  
  // Onboarding request methods
  createOnboardingRequest(request: InsertOnboardingRequest): Promise<OnboardingRequest>;
  
  // Contact message methods
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private onboardingRequests: Map<number, OnboardingRequest>;
  private contactMessages: Map<number, ContactMessage>;
  
  private userIdCounter: number;
  private productIdCounter: number;
  private onboardingRequestIdCounter: number;
  private contactMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.onboardingRequests = new Map();
    this.contactMessages = new Map();
    
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.onboardingRequestIdCounter = 1;
    this.contactMessageIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      approved: false, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }
  
  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }
  
  async clearProducts(): Promise<void> {
    this.products.clear();
    this.productIdCounter = 1;
  }
  
  // Onboarding request methods
  async createOnboardingRequest(insertRequest: InsertOnboardingRequest): Promise<OnboardingRequest> {
    const id = this.onboardingRequestIdCounter++;
    const request: OnboardingRequest = { 
      ...insertRequest, 
      id, 
      createdAt: new Date(),
      status: "pending" 
    };
    this.onboardingRequests.set(id, request);
    return request;
  }
  
  // Contact message methods
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageIdCounter++;
    const message: ContactMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.contactMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
