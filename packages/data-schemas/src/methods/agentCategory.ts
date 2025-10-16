import type { Model, Types } from 'mongoose';
import type { IAgentCategory } from '~/types';

export function createAgentCategoryMethods(mongoose: typeof import('mongoose')) {
  /**
   * Get all active categories sorted by order
   * @returns Array of active categories
   */
  async function getActiveCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true }).sort({ order: 1, label: 1 }).lean();
  }

  /**
   * Get categories with agent counts
   * @returns Categories with agent counts
   */
  async function getCategoriesWithCounts(): Promise<(IAgentCategory & { agentCount: number })[]> {
    const Agent = mongoose.models.Agent;

    const categoryCounts = await Agent.aggregate([
      { $match: { category: { $exists: true, $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(categoryCounts.map((c) => [c._id, c.count]));
    const categories = await getActiveCategories();

    return categories.map((category) => ({
      ...category,
      agentCount: countMap.get(category.value) || (0 as number),
    })) as (IAgentCategory & { agentCount: number })[];
  }

  /**
   * Get valid category values for Agent model validation
   * @returns Array of valid category values
   */
  async function getValidCategoryValues(): Promise<string[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({ isActive: true }).distinct('value').lean();
  }

  /**
   * Seed initial categories from existing constants
   * @param categories - Array of category data to seed
   * @returns Bulk write result
   */
  async function seedCategories(
    categories: Array<{
      value: string;
      label?: string;
      description?: string;
      order?: number;
      custom?: boolean;
    }>,
  ): Promise<import('mongoose').mongo.BulkWriteResult> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    const operations = categories.map((category, index) => ({
      updateOne: {
        filter: { value: category.value },
        update: {
          $setOnInsert: {
            value: category.value,
            label: category.label || category.value,
            description: category.description || '',
            order: category.order || index,
            isActive: true,
            custom: category.custom || false,
          },
        },
        upsert: true,
      },
    }));

    return await AgentCategory.bulkWrite(operations);
  }

  /**
   * Find a category by value
   * @param value - The category value to search for
   * @returns The category document or null
   */
  async function findCategoryByValue(value: string): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOne({ value }).lean();
  }

  /**
   * Create a new category
   * @param categoryData - The category data to create
   * @returns The created category
   */
  async function createCategory(categoryData: Partial<IAgentCategory>): Promise<IAgentCategory> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const category = await AgentCategory.create(categoryData);
    return category.toObject() as IAgentCategory;
  }

  /**
   * Update a category by value
   * @param value - The category value to update
   * @param updateData - The data to update
   * @returns The updated category or null
   */
  async function updateCategory(
    value: string,
    updateData: Partial<IAgentCategory>,
  ): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findOneAndUpdate(
      { value },
      { $set: updateData },
      { new: true, runValidators: true },
    ).lean();
  }

  /**
   * Delete a category by value
   * @param value - The category value to delete
   * @returns Whether the deletion was successful
   */
  async function deleteCategory(value: string): Promise<boolean> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    const result = await AgentCategory.deleteOne({ value });
    return result.deletedCount > 0;
  }

  /**
   * Find a category by ID
   * @param id - The category ID to search for
   * @returns The category document or null
   */
  async function findCategoryById(id: string | Types.ObjectId): Promise<IAgentCategory | null> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.findById(id).lean();
  }

  /**
   * Get all categories (active and inactive)
   * @returns Array of all categories
   */
  async function getAllCategories(): Promise<IAgentCategory[]> {
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;
    return await AgentCategory.find({}).sort({ order: 1, label: 1 }).lean();
  }

  /**
   * Ensure default categories exist and update them if they don't have localization keys
   * @param customCategories - Optional custom categories from config (overrides defaults)
   * @returns Promise<boolean> - true if categories were created/updated, false if no changes
   */
  async function ensureDefaultCategories(
    customCategories?: Array<{
      value: string;
      label: string;
      description?: string;
      order?: number;
    }>,
  ): Promise<boolean> {
    console.log('[DEBUG ensureDefaultCategories] Received:', JSON.stringify(customCategories, null, 2));
    const AgentCategory = mongoose.models.AgentCategory as Model<IAgentCategory>;

    // Use custom categories if provided and not empty, otherwise use defaults
    const defaultCategories = (customCategories && customCategories.length > 0) ? customCategories : [
      {
        value: 'general',
        label: 'com_agents_category_general',
        description: 'com_agents_category_general_description',
        order: 0,
      },
      {
        value: 'hr',
        label: 'com_agents_category_hr',
        description: 'com_agents_category_hr_description',
        order: 1,
      },
      {
        value: 'rd',
        label: 'com_agents_category_rd',
        description: 'com_agents_category_rd_description',
        order: 2,
      },
      {
        value: 'finance',
        label: 'com_agents_category_finance',
        description: 'com_agents_category_finance_description',
        order: 3,
      },
      {
        value: 'it',
        label: 'com_agents_category_it',
        description: 'com_agents_category_it_description',
        order: 4,
      },
      {
        value: 'sales',
        label: 'com_agents_category_sales',
        description: 'com_agents_category_sales_description',
        order: 5,
      },
      {
        value: 'aftersales',
        label: 'com_agents_category_aftersales',
        description: 'com_agents_category_aftersales_description',
        order: 6,
      },
    ];

    console.log('[DEBUG ensureDefaultCategories] Using categories:', JSON.stringify(defaultCategories, null, 2));
    let existingCategories = await getAllCategories();
    console.log('[DEBUG ensureDefaultCategories] Existing categories:', existingCategories.length);
    console.log('[DEBUG ensureDefaultCategories] Existing list:', JSON.stringify(existingCategories, null, 2));
    
    // If custom categories are provided, delete non-custom categories that are not in the custom list
    if (customCategories && customCategories.length > 0) {
      const customCategoryValues = new Set(customCategories.map((cat) => cat.value));
      const categoriesToDelete = existingCategories.filter(
        (cat) => !cat.custom && !customCategoryValues.has(cat.value),
      );
      
      if (categoriesToDelete.length > 0) {
        console.log('[DEBUG ensureDefaultCategories] Deleting obsolete default categories:', categoriesToDelete.map(c => c.value));
        for (const cat of categoriesToDelete) {
          await deleteCategory(cat.value);
        }
        // Refresh the list after deletion
        existingCategories = await getAllCategories();
        console.log('[DEBUG ensureDefaultCategories] Remaining categories after deletion:', existingCategories.length);
      }
    }
    
    const existingCategoryMap = new Map(existingCategories.map((cat) => [cat.value, cat]));

    const updates = [];
    let created = 0;

    for (const defaultCategory of defaultCategories) {
      const existingCategory = existingCategoryMap.get(defaultCategory.value);
      console.log(`[DEBUG ensureDefaultCategories] Processing ${defaultCategory.value}, exists:`, !!existingCategory);

      if (existingCategory) {
        const isNotCustom = !existingCategory.custom;
        const hasLocalizationKey = existingCategory.label.startsWith('com_');
        const needsLocalization = !defaultCategory.label.startsWith('com_');

        // Only update if the existing category has a localization key and needs updating
        if (isNotCustom && hasLocalizationKey && needsLocalization) {
          updates.push({
            value: defaultCategory.value,
            label: defaultCategory.label,
            description: defaultCategory.description,
          });
        }
        // If existing category doesn't have localization key, it's already correct - skip
      } else {
        console.log(`[DEBUG ensureDefaultCategories] Creating category:`, defaultCategory.value);
        await createCategory({
          ...defaultCategory,
          isActive: true,
          custom: false,
        });
        created++;
      }
    }

    console.log(`[DEBUG ensureDefaultCategories] Created: ${created}, Updates: ${updates.length}`);
    if (updates.length > 0) {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { value: update.value, custom: { $ne: true } },
          update: {
            $set: {
              label: update.label,
              description: update.description,
            },
          },
        },
      }));

      await AgentCategory.bulkWrite(bulkOps, { ordered: false });
    }

    return updates.length > 0 || created > 0;
  }

  return {
    getActiveCategories,
    getCategoriesWithCounts,
    getValidCategoryValues,
    seedCategories,
    findCategoryByValue,
    createCategory,
    updateCategory,
    deleteCategory,
    findCategoryById,
    getAllCategories,
    ensureDefaultCategories,
  };
}

export type AgentCategoryMethods = ReturnType<typeof createAgentCategoryMethods>;
