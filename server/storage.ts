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
    const user = {
      ...insertUser, 
      id, 
      approved: false, 
      createdAt: new Date() 
    } as User;
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
    // drizzle-zod 0.5 mis-infers array/JSON columns in this non-strict TS config.
    // Route inputs are parsed by insertProductSchema before reaching this store.
    const product = { ...insertProduct, id } as unknown as Product;
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
    // insertOnboardingRequestSchema likewise validates productsOfInterest as string[].
    const request = {
      ...insertRequest, 
      id, 
      createdAt: new Date(),
      status: "pending" 
    } as unknown as OnboardingRequest;
    this.onboardingRequests.set(id, request);
    return request;
  }
  
  // Contact message methods
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageIdCounter++;
    const message = {
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    } as ContactMessage;
    this.contactMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
