export const findOne = async ({
  model,
  filter = {},

  options = {},
} = {}) => {
  const doc = model.findOne(filter);
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.select) {
    doc.select(options.select);
  }
  if (options.lean) {
    doc.lean();
  }

  return await doc.exec();
};

export const create = async ({
  model,
  data = [{}],
  options = { validateBeforeSave: true },
} = {}) => {
  console.log({ data });

  return await model.create(data, options);
};

export const createOne = async ({
  model,
  data = [{}],
  options = { validateBeforeSave: true },
} = {}) => {
  const [doc] = await create({ model, data: [data], options });

  return doc;
};

export const findById = async ({ id, options = {}, model } = {}) => {
  const doc = model.findById(id);
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.select) {
    doc.select(options.select);
  }
  if (options.lean) {
    doc.lean();
  }

  return await doc.exec();
};

export const find = async ({ filter, options = {}, model } = {}) => {
  const doc = model.find(filter);
  if (options.populate) {
    doc.populate(options.populate);
  }
  if (options.select) {
    doc.select(options.select);
  }
  if (options.skip) {
    doc.skip(options.skip);
  }
  if (options.limit) {
    doc.limit(options.limit);
  }
  if (options.lean) {
    doc.lean();
  }
  if (options.sort) {
    doc.sort(options.sort);
  }

  return await doc.exec();
};

export const insertMany = async ({ data, model } = {}) => {
  return await model.insertMany(data);
};

export const updateOne = async ({
  filter,
  update,
  options = {},
  model,
} = {}) => {
  return await model.updateOne(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    options,
  );
};

export const findOneAndUpdate = async ({
  filter,
  update,
  options = {},
  model,
} = {}) => {
  return await model.findOneAndUpdate(
    filter || {},
    { ...update, $inc: { __v: 1 } },
    {
      new: true,
      runValidators: true,

      ...options,
    },
  );
};

export const findByIdAndUpdate = async ({
  id,
  update,
  options = { new: true },
  model,
} = {}) => {
  return await model.findByIdAndUpdate(
    id || {},
    { ...update, $inc: { __v: 1 } },
    {
      new: true,
      runValidators: true,

      ...options,
    },
  );
};

export const deleteOne = async ({ filter, model } = {}) => {
  return await model.deleteOne(filter || {});
};
export const deleteMany = async ({ filter, model } = {}) => {
  return await model.deleteMany(filter || {});
};

export const findOneAndDelete = async ({ filter, model } = {}) => {
  return await model.findOneAndDelete(filter || {});
};

export const countDocuments = async ({ filter = {}, model } = {}) => {
  return await model.countDocuments(filter);
};

export const paginate = async ({
  filter = {},
  options = {},
  model,
  page = 1,
  limit = 5,
} = {}) => {
  const skip = (page - 1) * limit;
  const count = await countDocuments({ model, filter });
  const pages = Math.ceil(count / limit);

  const docs = await find({
    model,
    filter,
    options:{
      ...options,
      skip,limit
    },
  });

  return { currentPage: page, count, pages, limit, docs };
};
