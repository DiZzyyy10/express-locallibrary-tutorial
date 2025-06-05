const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "在庫一覧", // Translated (List of Stock Items/Book Copies)
    bookinstance_list: allBookInstances,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    const err = new Error("本のコピーが見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    // title: "Book:", // Original
    title: "コピー詳細", // Translated (Copy Detail) - Note: your pug for this page may use bookinstance._id as H1
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

  res.render("bookinstance_form", {
    title: "在庫作成", // Translated (Create Stock Item/Book Copy)
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "書籍を選択してください。") // Translated
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "奥付情報を入力してください。") // Translated
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "無効な日付です。") // Translated
    .optional({ values: "falsy" }) // Keep .optional({ checkFalsy: true }) if using older express-validator
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render form again with sanitized values and error messages.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "在庫作成", // Translated
        book_list: allBooks,
        selected_book: bookInstance.book._id, // If bookInstance.book is just an ID string, ._id might not be needed
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    // No results.
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "在庫削除", // Translated (Delete Stock Item/Book Copy)
    bookinstance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  // Assume valid BookInstance id in field. (Original comment)
  // Ensure req.body.id matches the 'name' attribute in your form's hidden input.
  // The tutorial often uses 'bookinstanceid' or a specific id name.
  await BookInstance.findByIdAndDelete(req.body.id); // Or req.body.bookinstanceid if that's the form field name
  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  // Get book, all books for form (in parallel)
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate("book").exec(),
    Book.find({}, "title").sort({ title: 1 }).exec(), // Added sort and projection for consistency
  ]);

  if (bookInstance === null) {
    // No results.
    const err = new Error("本のコピーが見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "在庫更新", // Translated (Update Stock Item/Book Copy)
    book_list: allBooks,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  });
});

// Handle BookInstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "書籍を選択してください。") // Translated
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("imprint", "奥付情報を入力してください。") // Translated
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "無効な日付です。") // Translated
    .optional({ values: "falsy" }) // Keep .optional({ checkFalsy: true }) if using older express-validator
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors.
      // Render the form again, passing sanitized values and errors.
      const allBooks = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render("bookinstance_form", {
        title: "在庫更新", // Translated
        book_list: allBooks,
        selected_book: bookInstance.book._id, // If bookInstance.book is an ID string, ._id might not be needed
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      // Data from form is valid.
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      // Redirect to detail page.
      res.redirect(bookInstance.url);
    }
  }),
];