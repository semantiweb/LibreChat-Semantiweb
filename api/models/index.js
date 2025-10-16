const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const methods = createMethods(mongoose);
const { comparePassword } = require('./userMethods');
const {
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,
} = require('./File');
const {
  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,
} = require('./Message');
const { getConvoTitle, getConvo, saveConvo, deleteConvos } = require('./Conversation');
const { getPreset, getPresets, savePreset, deletePresets } = require('./Preset');
const { File } = require('~/db/models');

const seedDatabase = async (categoriesFromConfig) => {
  console.log('[DEBUG seedDatabase] Categories from config:', JSON.stringify(categoriesFromConfig, null, 2));
  console.log('[DEBUG seedDatabase] Is array?', Array.isArray(categoriesFromConfig));
  console.log('[DEBUG seedDatabase] Length:', categoriesFromConfig?.length);
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  console.log('[DEBUG seedDatabase] Calling ensureDefaultCategories with:', JSON.stringify(categoriesFromConfig, null, 2));
  await methods.ensureDefaultCategories(categoriesFromConfig);
  console.log('[DEBUG seedDatabase] Done');
};

module.exports = {
  ...methods,
  seedDatabase,
  comparePassword,
  findFileById,
  createFile,
  updateFile,
  deleteFile,
  deleteFiles,
  getFiles,
  updateFileUsage,

  getMessage,
  getMessages,
  saveMessage,
  recordMessage,
  updateMessage,
  deleteMessagesSince,
  deleteMessages,

  getConvoTitle,
  getConvo,
  saveConvo,
  deleteConvos,

  getPreset,
  getPresets,
  savePreset,
  deletePresets,

  Files: File,
};
