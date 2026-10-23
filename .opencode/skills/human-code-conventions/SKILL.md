
---
name: human-code-conventions
description: Enforces idiomatic, project-consistent naming for variables, functions, methods, classes, interfaces, types, enums, constants, files, directories, components, hooks, tests, and modules. Use when writing, editing, reviewing, refactoring, or naming code in any programming language.
---

# Human Code Conventions

## 1. Purpose

Write code using naming conventions that experienced engineers
would naturally choose for a maintainable, professionally developed
codebase.

Names must be:

- Meaningful and specific.
- Consistent with the existing project.
- Idiomatic for the programming language and framework.
- Appropriate to the abstraction and responsibility.
- Easy to understand without excessive comments.
- Concise without sacrificing clarity.
- Consistent across related modules and APIs.

Avoid generic, repetitive, unnecessarily verbose, artificial, or
template-like names that obscure the purpose of the code.

Do not intentionally make code inconsistent to make it appear
human-written. Natural naming comes from domain understanding,
clear responsibilities, and established engineering conventions.

## 2. Rule Priority

When choosing a name, follow this priority order:

1. Explicit naming requirements provided by the user.
2. Existing repository-specific naming conventions and instructions.
3. Official language and framework conventions.
4. Established conventions used by comparable modules in the project.
5. General naming principles defined in this skill.

Do not impose a personal naming preference when the project already
has a consistent, reasonable convention.

When conventions conflict, follow the highest-priority applicable
rule and keep related code consistent.

Inspect the repository before deciding how to name new symbols.

## 3. Understand the Domain Before Naming

Before naming a symbol, determine:

- What responsibility it represents.
- What data it holds or transforms.
- What behavior it performs.
- Which domain concept it corresponds to.
- Where it belongs in the architecture.
- Whether an established name already exists.
- Whether the name is part of a public API or internal implementation.

Prefer terminology already used by the product, domain model,
database schema, API contracts, and existing modules.

For example, in an order-management application, prefer names such
as `pendingOrders`, `calculateOrderTotal`, and `OrderRepository`
when those names accurately describe their responsibilities.

Do not invent alternative terminology for an established domain
concept without a good reason.

## 4. General Naming Principles

### 4.1 Name Things by Their Actual Responsibility

Use a name that communicates the purpose of the symbol.

Prefer:

- `calculateInvoiceTotal`
- `findActiveSession`
- `validateEmailAddress`
- `pendingOrders`
- `paymentAttempts`

Avoid vague names such as:

- `processData`
- `handleStuff`
- `doOperation`
- `myFunction`
- `tempValue`
- `someObject`

These names are not inherently forbidden. They are inappropriate
when a more specific name is available and useful.

### 4.2 Prefer Established Domain Language

Use terminology understood by engineers working in the domain.

Prefer `refreshAccessToken` over `updateToken` when the operation
specifically refreshes an access token.

Prefer `cancelSubscription` over `changeStatus` when cancellation
is the actual business operation.

Do not replace established technical terms with unnecessarily
creative or informal alternatives.

### 4.3 Avoid Redundant Names

Do not repeat information already communicated by the containing
module, class, namespace, or function.

For example, inside an `OrderService` class:

Prefer:

    calculateTotal()
    findById()
    cancel()

Avoid:

    calculateOrderTotalInOrderService()
    findOrderByIdFromOrderService()
    cancelOrderInOrderService()

However, public exports and standalone functions may need more
specific names to remain clear outside their original context.

### 4.4 Avoid Meaningless Abbreviations

Prefer descriptive names over cryptic abbreviations.

Prefer:

    customerAddress
    expirationTimestamp
    authenticationToken

Avoid:

    custAddr
    expTs
    authTok

Use conventional abbreviations when they are well established
in the language, domain, or project, such as `id`, `url`, `api`,
`http`, `db`, and `DTO`, where appropriate.

Keep common mathematical, algorithmic, and domain-specific
notations when they improve clarity.

### 4.5 Use Appropriate Specificity

Names should be as specific as necessary, not as long as possible.

Prefer `retryCount` over `count` when several counts exist.

Prefer `users` over `userCollectionDataArray` when the surrounding
context already establishes the collection's purpose.

Avoid both excessively generic names and long names that merely
repeat surrounding context.

### 4.6 Avoid Unnecessary Synonyms

Use one established term consistently for the same concept.

Do not alternate between `customer`, `client`, `buyer`, and
`accountHolder` when all refer to the same entity without a
meaningful domain distinction.

Different concepts should retain different names even when
they contain similar data.

### 4.7 Make Boolean Names Read Naturally

Boolean names should communicate a condition, state, or capability.

Prefer:

    isAuthenticated
    hasPermission
    canRetry
    shouldRefreshToken
    isPaymentComplete

Use the conventions of the language or framework where they differ.

Avoid ambiguous boolean names such as `flag`, `active`, or `valid`
when the exact meaning matters.

Do not force an `is` prefix on every boolean if the project or
language convention favors another natural form.

### 4.8 Avoid Misleading Names

A name must describe what the code actually does.

Do not name a function `validateEmail` if it only checks whether
a string is non-empty.

Do not name a variable `userCount` if it stores a collection
of users.

Do not name an operation `saveChanges` if it only updates
an in-memory object and does not persist changes.

If the implementation changes, reconsider its name.

---

## 5. Variables and Parameters

Choose names based on the variable's role and lifetime.

### Local Variables

Prefer meaningful names that communicate intent.

    const activeUsers = users.filter(isActiveUser);
    const unpaidInvoices = invoices.filter(isInvoiceUnpaid);
    const expirationDate = calculateExpirationDate(session);

Avoid meaningless names such as:

    const data = ...
    const result = ...
    const temp = ...
    const item2 = ...

Generic names can be appropriate when the context makes their
meaning obvious, but do not use them as a default.

### Function Parameters

Parameter names should describe the expected input.

Prefer:

    function findUserByEmail(email: string) {}

    function calculateDiscount(
      subtotal: number,
      discountRate: number
    ) {}

Avoid:

    function findUserByEmail(value: string) {}

    function calculateDiscount(a: number, b: number) {}

Use `value`, `item`, `event`, `error`, or similar names when
they are genuinely the clearest terms in the local context.

### Collection Variables

Use plural nouns for collections when appropriate.

    users
    pendingPayments
    failedRequests
    databaseConnections

Use singular nouns for individual elements.

    user
    payment
    request
    connection

### Temporary Variables

Short names are acceptable for small, local scopes where their
meaning is immediately clear.

Examples include `i` for a simple loop index or `x` and `y`
for conventional coordinates.

Do not use short names throughout larger functions merely
to reduce typing.

### Avoid Artificial Numbered Names

Avoid names such as:

    userData1
    userData2
    handleRequest2
    processItem3

Prefer names that distinguish the actual roles:

    billingAddress
    shippingAddress
    createRequest
    retryRequest

Numbered names are appropriate when the numbers have real domain
meaning, such as protocol versions, numbered coordinates, or
ordered test cases.

---

## 6. Functions and Methods

Functions should have names that describe their behavior.

### Use Verbs for Operations

Prefer:

    createUser
    updateProfile
    deleteExpiredSessions
    calculateTax
    parseConfiguration
    sendVerificationEmail

Choose the verb that accurately describes the operation.

Do not automatically prefix every function with `handle`, `process`,
`execute`, or `perform`.

These verbs are acceptable when they accurately describe the
responsibility, such as `handleWebhookEvent` or `executeQuery`.

### Queries and Mutations

Make the intended operation clear.

Prefer:

    findUserById
    listActiveSubscriptions
    countFailedAttempts
    createInvoice
    revokeAccessToken

Use `get`, `find`, `fetch`, `load`, and `list` according to the
distinctions already established in the project.

Do not introduce artificial distinctions between these verbs
if the project uses them interchangeably and there is no need
to change that convention.

### Predicates

Boolean-returning functions should read like conditions.

Prefer:

    isExpired
    hasAccess
    canSubmitPayment
    isWithinRetryLimit

For collection predicates, use familiar names such as `some`,
`every`, and `isEmpty` where appropriate.

### Event Handlers and Callbacks

Use the framework's established event naming conventions.

Examples:

    handleSubmit
    handlePaymentSuccess
    onUserCreated
    onConnectionClosed

Use `handleX` for handlers and `onX` for callbacks or event
properties when that distinction matches the framework's conventions.

Do not introduce both naming styles arbitrarily.

### Avoid Unclear Side Effects

Function names should not conceal important side effects.

If a function sends a notification, persists data, or revokes
access, its name or surrounding API should make that behavior
understandable.

Do not rename every function to enumerate every internal step.
Communicate the primary responsibility.

### Single Responsibility

If a function's name requires a long sequence of unrelated verbs,
consider whether the function has too many responsibilities.

For example, a function named `validateAndSaveAndNotifyAndUpdateCache`
may indicate an opportunity to separate operations.

Do not split a cohesive operation into excessive tiny functions
solely to satisfy a naming preference.

---

## 7. Classes, Interfaces, Types, and Enums

Follow the language's established conventions.

### Classes

Use meaningful nouns or noun phrases.

Examples:

    UserService
    OrderRepository
    PaymentGateway
    SessionManager

The name must reflect the actual responsibility.

Avoid meaningless names such as `HelperClass`, `GeneralManager`,
or `MyCustomObject` when a specific domain concept is available.

Do not use `Manager`, `Handler`, `Helper`, or `Processor` as
automatic suffixes. Use them when they accurately represent the
abstraction.

### Interfaces

Name interfaces after the contract or capability they represent.

Examples:

    PaymentGateway
    UserRepository
    Clock
    CacheStore

In TypeScript, Java, and similar ecosystems, avoid prefixes such
as `IUserService` when the project's established convention uses
plain descriptive names.

In languages or frameworks where a prefix or suffix is standard,
follow that convention.

Do not create an interface solely to add a naming abstraction
when it serves no architectural purpose.

### Types and Type Aliases

Use descriptive names for domain types and structural contracts.

Examples:

    UserProfile
    CreateOrderInput
    PaymentStatus
    PaginationOptions
    ApiErrorResponse

Avoid vague names such as `DataType`, `ObjectType`, or `CustomType`
when a meaningful domain name exists.

Use suffixes such as `Input`, `Output`, `Options`, `Config`,
`Payload`, `Response`, or `Result` when they accurately describe
the type's role.

Do not append suffixes automatically to every type.

### Enums and Union Types

Name the overall type according to its domain concept.

For example:

    enum PaymentStatus {
      Pending,
      Completed,
      Failed
    }

The exact casing and member style must follow the language
and repository conventions.

For string unions, use meaningful, consistent literal values.

Avoid names that duplicate the type name unnecessarily or
make the state difficult to interpret.

### Abstract Classes and Implementations

Use `Abstract` or `Base` prefixes only when they communicate
a meaningful role and match the language or project convention.

Use implementation suffixes such as `PostgresUserRepository`
when the implementation technology or distinction matters.

Avoid redundant names such as `UserServiceInterfaceImpl`
when a simpler, established convention exists.

---

## 8. Constants and Configuration

Use the project's constant naming convention.

In TypeScript and JavaScript, `UPPER_SNAKE_CASE` is common for
module-level constants that represent fixed configuration or
stable values:

    const MAX_LOGIN_ATTEMPTS = 5;
    const DEFAULT_PAGE_SIZE = 20;

However, ordinary `const` variables are not automatically constants
in the semantic sense and commonly use `camelCase`:

    const currentUser = await findCurrentUser();
    const retryCount = 0;

Follow the existing codebase rather than converting every
constant binding to uppercase.

In Python, use `UPPER_SNAKE_CASE` for module-level constants.

In Java, follow established `static final` constant conventions.

Avoid names such as:

    VALUE
    CONFIG
    SETTINGS
    DEFAULT

unless the surrounding scope makes the meaning genuinely clear.

Prefer names such as `DEFAULT_SESSION_TIMEOUT` or
`MAX_UPLOAD_SIZE` when those names accurately describe the value.

Do not embed environment-specific secrets or credentials in names
or source code.

---

## 9. File and Directory Naming

File and directory names are part of the public structure of
a codebase. They should communicate responsibility and follow
the ecosystem's conventions.

### First Inspect the Existing Project

Before creating a file, inspect neighboring files and identify:

- File casing conventions.
- Whether files are named after their primary export.
- Whether the project groups files by feature or technical layer.
- Existing component, hook, service, test, and type naming patterns.
- Import and module-resolution conventions.

Keep related files consistent.

### Common Naming Patterns

Use the following as defaults, not universal rules.

| File responsibility | Common pattern |
|---|---|
| React component | `UserProfile.tsx` or `user-profile.tsx` |
| React hook | `useOrderHistory.ts` |
| Service module | `user-service.ts` or `userService.ts` |
| Repository module | `user-repository.ts` |
| Utility module | `date-formatting.ts` |
| Type definitions | `user-types.ts` |
| Unit tests | `user-service.test.ts` |
| Integration tests | `user-service.integration.test.ts` |
| Python module | `user_service.py` |
| Python test | `test_user_service.py` |
| Go source file | `user_service.go` |
| Rust module | `user_service.rs` |
| Java class | `UserService.java` |

Follow the repository's actual convention even if another pattern
is equally reasonable.

### File Naming Rules

- Prefer names that describe the file's primary responsibility.
- Keep filenames concise and specific.
- Match the filename to the primary export when the framework
  or project convention expects it.
- Use one naming style consistently within the same directory.
- Avoid meaningless names such as `misc`, `stuff`, `common`,
  `helpers2`, and `new-file` when a specific name is available.
- Do not create several files with nearly identical names unless
  their responsibilities are genuinely distinct.
- Avoid abbreviations that make a file's purpose unclear.
- Follow required framework filenames exactly.

### Avoid Catch-All Modules

Do not automatically place unrelated functionality into files
named `utils`, `helpers`, `common`, or `misc`.

These names are acceptable when the module has a coherent,
well-understood responsibility.

If a utility module becomes a collection of unrelated functions,
consider separating it into cohesive modules such as:

    date-formatting.ts
    currency-formatting.ts
    string-normalization.ts

Do not create a separate file for every trivial function without
a meaningful architectural reason.

### File Renaming Safety

Before renaming a file, inspect its import references, tests,
framework conventions, configuration, and generated-code dependencies.

Avoid renaming existing files merely to match your preferred style
when they already follow the repository's established convention.

Do not perform broad renaming without a clear requirement and
a plan for updating references.

---

## 10. Language-Specific Conventions

Apply the conventions of the language being written. These are
defaults; official guidance and existing project conventions take
precedence.

### TypeScript and JavaScript

Typical conventions:

- Variables and functions: `camelCase`
- Classes: `PascalCase`
- Interfaces and type aliases: `PascalCase`
- React components: `PascalCase`
- React hooks: `use` followed by a descriptive `camelCase` name
- Enum types: `PascalCase`
- Enum members: follow the project's established convention
- Module constants: follow semantic meaning and project conventions
- Files: follow the framework and repository convention

Examples:

    const activeSubscriptions = [];
    function calculateMonthlyRevenue() {}
    class SubscriptionService {}
    interface PaymentGateway {}
    type SubscriptionStatus = "active" | "cancelled";
    function useSubscriptionHistory() {}

Avoid:

    function doStuff() {}
    class DataManager2 {}
    interface ISubscriptionService {}
    const responseDataObjectThing = {};

The last examples are not universally invalid; reject them when
their names are vague, redundant, or inconsistent with the project.

### React and Next.js

- Use `PascalCase` for React component names.
- Use `camelCase` for hooks and ordinary functions.
- Prefix custom hooks with `use`.
- Match component filenames to the project's component naming style.
- Preserve required framework filenames such as `page.tsx`,
  `layout.tsx`, `loading.tsx`, and `error.tsx` where applicable.
- Use descriptive names for props and event handlers.
- Prefer domain-specific hooks over generic hooks when the behavior
  is specific to one feature.

Examples:

    UserProfile.tsx
    useOrderHistory.ts
    handlePaymentSubmit
    onSubscriptionCancelled

Do not rename framework-defined files to improve naming aesthetics.

### Python

Typical conventions:

- Variables and functions: `snake_case`
- Modules and packages: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Methods: `snake_case`
- Exception classes: descriptive `PascalCase` names, commonly
  ending in `Error` when appropriate
- Type variables and protocols: follow established Python typing
  conventions and the surrounding codebase

Examples:

    active_users = []
    def calculate_invoice_total():
        pass

    class PaymentService:
        pass

    MAX_RETRY_ATTEMPTS = 5

Follow PEP 8 and relevant typing conventions.

### Java

Typical conventions:

- Classes and interfaces: `PascalCase`
- Methods and variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Packages: lowercase, commonly dot-separated
- Generic type parameters: meaningful single uppercase letters
  for simple conventional cases, or descriptive names when needed

Examples:

    UserService
    PaymentGateway
    calculateInvoiceTotal
    MAX_RETRY_ATTEMPTS

Follow established Java conventions and framework patterns.

### Go

Typical conventions:

- Packages: short, meaningful, lowercase names.
- Exported identifiers: `PascalCase`.
- Unexported identifiers: `camelCase`.
- Acronyms: use conventional forms such as `ID`, `URL`, and `HTTP`.
- Interfaces: name around the behavior or capability they represent.
- Test files: use the `_test.go` suffix.
- Avoid unnecessary package names embedded in identifiers.

Examples:

    UserRepository
    userRepository
    FindByID
    HTTPClient

Follow Go's standard naming guidance and package conventions.

### Rust

Typical conventions:

- Variables and functions: `snake_case`
- Modules: `snake_case`
- Types, traits, and enums: `PascalCase`
- Constants and statics: `SCREAMING_SNAKE_CASE`
- Trait names: describe the behavior or capability.
- Associated functions: follow standard Rust API conventions.

Examples:

    calculate_invoice_total
    struct UserProfile {}
    trait PaymentGateway {}
    const MAX_RETRY_ATTEMPTS: u32 = 5;

Follow Rust API guidelines and ecosystem conventions.

### C and C++

Naming depends strongly on the codebase and project standard.

- Follow the established conventions for functions, types, members,
  macros, constants, and namespaces.
- Preserve conventional uppercase macro names where appropriate.
- Keep public headers and source files consistent.
- Avoid mixing naming styles arbitrarily.
- Respect existing API and ABI compatibility.

Do not impose a single universal casing style across all C and
C++ projects.

### C#

Typical conventions:

- Classes, interfaces, structs, enums, and public members:
  `PascalCase`
- Local variables and parameters: `camelCase`
- Private fields: follow the repository convention, commonly
  `_camelCase` in many .NET projects
- Async methods: use the `Async` suffix when appropriate
- Interfaces: conventionally use the `I` prefix in .NET

Examples:

    IUserRepository
    UserService
    CalculateInvoiceTotalAsync
    _connectionFactory

Unlike TypeScript or JavaScript projects, the `I` interface prefix
is a normal .NET convention and should not be removed automatically.

### SQL

Follow the database engine and repository conventions.

- Use meaningful table and column names.
- Keep naming consistent across schemas and migrations.
- Use the established casing and singular/plural conventions.
- Use clear names for constraints and indexes when required.
- Preserve exact identifiers when they are part of an existing
  database contract.

Prefer names such as `created_at`, `order_items`, or `user_id`
when they match the project's SQL conventions.

### Other Languages

When working in a language not listed above:

1. Inspect existing source files.
2. Identify the language's official naming guidance.
3. Follow standard library and framework conventions.
4. Prefer established ecosystem patterns.
5. Avoid importing naming conventions from an unrelated language.

Never assume that one language's naming rules apply universally.

---

## 11. Framework-Specific Naming

Framework conventions take precedence over general preferences
when the framework requires particular names.

Examples include:

- React components and custom hooks.
- Next.js routing and special files.
- Angular components, services, directives, and pipes.
- NestJS modules, controllers, services, and guards.
- Django apps, models, views, and serializers.
- FastAPI routers, schemas, and dependency functions.
- Spring controllers, services, repositories, and DTOs.
- Go package and interface conventions.
- ORM models, migrations, relations, and generated clients.

Before creating framework-specific files, inspect the installed
framework version and existing project structure.

Do not invent framework naming conventions or rename required
files to satisfy a generic rule.

---

## 12. API, Database, and Contract Naming

Names that cross system boundaries require additional care.

### API Endpoints

Follow the existing API style and established resource vocabulary.

Use resource-oriented names when appropriate.

Do not introduce inconsistent naming or HTTP semantics simply
because a different convention is aesthetically preferable.

### Request and Response Types

Use names that distinguish the direction and purpose of data.

Examples:

    CreateUserRequest
    UpdateProfileInput
    UserResponse
    PaginatedOrdersResponse

Follow existing suffix conventions rather than introducing
a new naming scheme for each feature.

### Database Entities

Keep entity, table, field, and relationship names consistent
with the domain model and persistence conventions.

Avoid renaming database fields or tables merely to make their
names look cleaner when doing so would require migrations or
break existing consumers.

### Public Contracts

Treat the following as compatibility-sensitive:

- Exported functions and classes.
- Public types and interfaces.
- API request and response fields.
- Database columns and tables.
- Event names and payload properties.
- Environment variable names.
- Serialized formats and external integrations.

Prefer preserving an established public name over making an
unnecessary cosmetic improvement.

If a breaking rename is required, plan the migration and update
all affected consumers.

---

## 13. Test Naming

Test names should explain the expected behavior or scenario.

Prefer descriptive test cases such as:

    rejectsExpiredAccessTokens
    calculatesDiscountForEligibleOrders
    returnsNotFoundWhenUserDoesNotExist

Or natural-language test descriptions:

    it("rejects expired access tokens", ...)
    it("calculates discounts for eligible orders", ...)

Follow the testing framework's conventions.

Use meaningful fixture and mock names that communicate their role.

Avoid vague test names such as:

    test1
    shouldWork
    handlesData
    testEverything

Do not write a test name that promises behavior the test does not
actually verify.

Test filenames should match the project's established test layout
and naming pattern.

---

## 14. Naming Anti-Patterns

Watch for the following patterns.

### Generic Names Without Useful Context

    data
    stuff
    thing
    result
    manager
    handler
    processor
    helper
    utils

These names are acceptable when context makes them precise.
They are problematic when they hide the actual responsibility.

### Artificially Elaborate Names

    processTheEntireUserInformationDataCollection
    handleAllTheThingsForTheCurrentRequest

Prefer concise, accurate names that describe the actual operation.

### Redundant Names

    userUserData
    orderOrderService
    calculateTotalCalculation

Remove repeated words unless they distinguish meaningful concepts.

### Numbered or Versioned Names Without Meaning

    processData2
    UserServiceNew
    UserServiceFinal
    handleRequestLatest

Use meaningful distinctions, such as `LegacyUserImporter` or
`V2PaymentRequest`, only when the distinction is real and necessary.

### Unnecessary Prefixes and Suffixes

Do not automatically add:

- `I` to every interface in languages that do not conventionally
  use that prefix.
- `Impl` to every implementation.
- `Manager` to every class.
- `Helper` to every utility.
- `Data` to every object.
- `Info` to every type.
- `New`, `Updated`, or `Final` to ordinary filenames.

Use such names when justified by established language, framework,
or project conventions.

### Inconsistent Terminology

Avoid introducing competing names for the same domain concept.

For example, do not use `purchase`, `order`, and `transaction`
interchangeably if the application defines them as distinct entities.

### Excessive Abstraction

Do not introduce extra interfaces, wrappers, classes, or files
solely to make naming appear more sophisticated.

Names should reflect a useful design, not manufacture one.

---

## 15. Refactoring and Existing Code

When modifying existing code, distinguish between creating a new
name and renaming an established symbol.

### New Code

Apply the strongest appropriate naming conventions from the start.

### Existing Code

Preserve established, reasonable names unless:

- The user explicitly requests a rename.
- The existing name is misleading or incorrect.
- The naming inconsistency creates real maintenance problems.
- A required architectural change makes the old name inaccurate.

Do not rename every symbol merely because another name seems better.

### Safe Renaming Procedure

Before renaming an existing symbol:

1. Find its definitions and references.
2. Check exports and imports.
3. Check tests and mocks.
4. Check API and database contracts.
5. Check framework-specific discovery conventions.
6. Check generated code and configuration references.
7. Determine whether the change is breaking.
8. Update all affected references where safe.
9. Run relevant tests, type checks, and build checks.

Avoid broad search-and-replace operations without understanding
the references.

Do not modify generated files directly unless the project's
generation workflow explicitly requires it.

---

## 16. Naming Review Before Completing a Task

Before finishing a coding task, review the names introduced or
substantially changed by the implementation.

Check the following:

### Variables and Parameters

- Do names communicate the actual data or purpose?
- Are boolean names unambiguous?
- Are collections and individual values distinguished?
- Are temporary names limited to suitable scopes?
- Are abbreviations conventional and understandable?

### Functions and Methods

- Does each name accurately describe the operation?
- Are query and mutation semantics clear?
- Are event handlers named consistently?
- Do names conceal important side effects?
- Do long or compound names suggest unclear responsibilities?

### Classes, Interfaces, and Types

- Does each name represent the actual abstraction?
- Are domain terms consistent?
- Are interfaces named according to the language convention?
- Are suffixes necessary and meaningful?
- Are redundant abstractions being introduced?

### Files and Directories

- Do filenames match the project's existing conventions?
- Does each file have a clear responsibility?
- Are framework-required filenames preserved?
- Are files being split or combined for a sound reason?
- Have imports and references been checked after renaming?

### Cross-Cutting Consistency

- Are similar concepts named consistently?
- Do public APIs follow established contracts?
- Are new names consistent with neighboring modules?
- Are generated files and third-party identifiers left intact?
- Are any names misleading, unnecessarily verbose, or vague?

Correct meaningful naming problems introduced by the task.
Avoid unrelated repository-wide renaming.

---

## 17. Working Procedure

For every coding task, follow this procedure:

1. Inspect the repository instructions and nearby code.
2. Identify the language, framework, and established conventions.
3. Understand the domain concept and responsibility being named.
4. Choose the simplest accurate, idiomatic name.
5. Check for existing terminology and naming conflicts.
6. Implement the code using consistent conventions.
7. Review the names of new symbols and files.
8. Verify that public contracts remain compatible.
9. Run relevant formatting, linting, type-checking, and tests.
10. Correct naming or structural issues introduced by the changes.

For naming-only tasks, inspect references and compatibility before
renaming anything.

Do not produce a naming report for every ordinary coding task
unless requested. Apply the skill naturally during implementation
and explain important naming decisions when useful.

---

## 18. Final Quality Standard

Every new name should answer the relevant question:

- Variable: What does this value represent?
- Function: What operation does this perform?
- Boolean: What condition or capability does this express?
- Class: What responsibility or concept does this model?
- Interface: What contract or capability does this define?
- Type: What shape or domain concept does this represent?
- Constant: What fixed value or policy does this encode?
- File: What primary responsibility does this module contain?
- Directory: What coherent group of functionality belongs here?
- Test: What behavior or scenario does this verify?

Prefer conventional, context-aware naming over generic names,
unnecessary creativity, artificial verbosity, or rigid rules
that conflict with the language.

The final result should feel natural to an engineer familiar with
the project's domain, language, and existing architecture.

The objective is not to make code look human by introducing
inconsistency. The objective is to make code clear, idiomatic,
coherent, and maintainable.
