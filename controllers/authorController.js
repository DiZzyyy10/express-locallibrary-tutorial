const Author = require("../models/author");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({ family_name: 1 }).exec();
  res.render("author_list", {
    title: "著者一覧", // Translated
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    const err = new Error("著者が見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "著者詳細", // Translated
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "著者作成" }); // Translated
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を入力してください。") // Translated
    .isAlphanumeric() // Note: isAlphanumeric might be restrictive for some Japanese names if they include Kana/Kanji. Consider if this validation is appropriate.
    .withMessage("名に英数字以外の文字が含まれています。"), // Translated
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("姓を入力してください。") // Translated
    .isAlphanumeric() // Note: isAlphanumeric might be restrictive for some Japanese names.
    .withMessage("姓に英数字以外の文字が含まれています。"), // Translated
  body("date_of_birth", "生年月日が無効です") // Translated
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "没年月日が無効です") // Translated
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "著者作成", // Translated
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Save author.
      await author.save();
      // Redirect to new author record.
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }

  res.render("author_delete", {
    title: "著者削除", // Translated
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books. Render in same way as for GET route.
    res.render("author_delete", {
      title: "著者削除", // Translated
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // Author has no books. Delete object and redirect to the list of authors.
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  if (author === null) {
    // No results.
    const err = new Error("著者が見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("author_form", { title: "著者更新", author: author }); // Translated
});

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("名を入力してください。") // Translated
    .isAlphanumeric() // Note: isAlphanumeric might be restrictive for some Japanese names.
    .withMessage("名に英数字以外の文字が含まれています。"), // Translated
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("姓を入力してください。") // Translated
    .isAlphanumeric() // Note: isAlphanumeric might be restrictive for some Japanese names.
    .withMessage("姓に英数字以外の文字が含まれています。"), // Translated
  body("date_of_birth", "生年月日が無効です") // Translated
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "没年月日が無効です") // Translated
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create Author object with escaped and trimmed data (and the old id!)
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("author_form", {
        title: "著者更新", // Translated
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      await Author.findByIdAndUpdate(req.params.id, author);
      res.redirect(author.url);
    }
  }),
];