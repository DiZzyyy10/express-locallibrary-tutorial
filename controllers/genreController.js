const Genre = require("../models/genre");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "ジャンル一覧", // Translated
    list_genres: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    const err = new Error("ジャンルが見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "ジャンル詳細", // Translated
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "ジャンル作成" }); // Translated
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "ジャンル名は3文字以上で入力してください。") // Translated
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "ジャンル作成", // Translated
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name (case insensitive for English characters) already exists.
      const genreExists = await Genre.findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 }) // Note on locale 'en' for collation
        .exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    // No results.
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete", {
    title: "ジャンル削除", // Translated
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (booksInGenre.length > 0) {
    // Genre has books. Render in same way as for GET route.
    res.render("genre_delete", {
      title: "ジャンル削除", // Translated
      genre: genre,
      genre_books: booksInGenre,
    });
    return;
  } else {
    // Genre has no books. Delete object and redirect to the list of genres.
    // Ensure req.body.id (or req.body.genreid) matches the hidden input in your form
    await Genre.findByIdAndDelete(req.body.id); // Or req.body.genreid
    res.redirect("/catalog/genres");
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();

  if (genre === null) {
    // No results.
    const err = new Error("ジャンルが見つかりません"); // Translated
    err.status = 404;
    return next(err);
  }

  res.render("genre_form", { title: "ジャンル更新", genre: genre }); // Translated
});

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body("name", "ジャンル名は3文字以上で入力してください。") // Translated
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request .
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data (and the old id!)
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("genre_form", {
        title: "ジャンル更新", // Translated
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      await Genre.findByIdAndUpdate(req.params.id, genre, {}); // Added {} as the third argument for options, though not strictly necessary if no options.
      res.redirect(genre.url);
    }
  }),
];