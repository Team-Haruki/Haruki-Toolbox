// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: navigationPages, sponsor, legal
export default {
  "navigationPages": {
    "friendGroups": {
      "title": "Recommended groups",
      "description": "Recommended chat groups related to pjsk",
      "loading": "Loading...",
      "empty": "No recommended groups",
      "count": "{count} groups",
      "copyNumber": "Copy group number {number}",
      "copied": "Copied group number {number}",
      "copyFailed": "Could not copy. Copy the group number by hand.",
      "toast": {
        "loadFailedTitle": "Failed to load recommended groups"
      }
    },
    "friendLinks": {
      "title": "Friend links",
      "description": "Recommended websites friendly to Haruki project",
      "loading": "Loading...",
      "empty": "No friend links yet",
      "toast": {
        "loadFailedTitle": "Failed to load friend links"
      }
    },
    "about": {
      "title": "About Project Haruki",
      "subtitle": "A community initiative serving Project Sekai players",
      "projectIntro": {
        "p1Before": "Project Haruki is a community initiative under ",
        "p1Name": "Seiunx Network",
        "p1After": ", developed and maintained by its dedicated Haruki Dev Team, providing players of Project Sekai: Colorful Stage! feat. Hatsune Miku with high-quality game services and community support.",
        "p2": "Our core projects include HarukiBot NEO and Haruki Toolbox. Among them, HarukiBot NEO focuses on providing Chinese-speaking players with a wide range of convenient, intelligent game-helper features.",
        "p3": "In addition, we independently develop and maintain a series of high-performance open-source underlying utilities and microservices. These serve as a robust, stable foundation for the entire Haruki ecosystem, ensuring a smooth and responsive experience for all players."
      },
      "structure": {
        "title": "How we are organized",
        "haruki": "Runs Project Haruki: HarukiBot NEO, Haruki Toolbox and the services behind them",
        "seiunx": "Builds open-source projects beyond Project Haruki",
        "projectCount": "{count} open-source projects"
      },
      "contributors": {
        "title": "Contributors",
        "subtitle": "Project Haruki is built and kept running with the help of these people",
        "count": "{count} people",
        "filterLabel": "Filter by identity",
        "all": "All",
        "identities": {
          "founder": {
            "label": "Founder",
            "desc": "Started Project Haruki"
          },
          "core": {
            "label": "Core developer",
            "desc": "Main developers and maintainers of HarukiBot NEO"
          },
          "docs": {
            "label": "Documentation",
            "desc": "Maintainers of the HarukiBot NEO user documentation"
          },
          "collab": {
            "label": "External collaborator",
            "desc": "People outside Haruki Dev Team who have given Project Haruki a great deal of help"
          },
          "sponsor": {
            "label": "Gold sponsor",
            "desc": "Provided the servers behind HarukiBot NEO and the Haruki Sekai Asset site"
          }
        },
        "members": {
          "seiun": {
            "name": "SeiunKinagi",
            "quote": "“Pursuing infinite possibilities within a finite life”"
          },
          "lingqian": {
            "name": "xuanmingLQ"
          },
          "deseer": {
            "name": "Deseer",
            "quote": "「空に昇つて、光つて、消えて」"
          },
          "storyxy": {
            "name": "storyxy3",
            "quote": "“Beyond Light”"
          },
          "aposetles": {
            "name": "Aposetles",
            "quote": "Documentation feedback is always welcome"
          },
          "tianshinling": {
            "name": "TY_Ling"
          },
          "yangzi": {
            "name": "IwasakiYouko"
          },
          "watagashi": {
            "name": "Watagashi Uni"
          },
          "middlered": {
            "name": "MiddleRed"
          },
          "dnaroma": {
            "name": "DNARoma",
            "quote": "“0.1 + 0.2 = 0.300000004”"
          },
          "yamamoto": {
            "name": "Yamamoto"
          }
        }
      },
      "projects": {
        "title": "Open Source Projects",
        "subtitle": "A collection of high-performance open-source tools, microservices, and applications authored by us",
        "groups": {
          "haruki": {
            "title": "Haruki Dev Team",
            "desc": "Projects and services dedicated to Project Haruki"
          },
          "seiunx": {
            "title": "Seiunx Dev Team",
            "desc": "General-purpose open-source projects under Seiunx Network"
          }
        },
        "list": {
          "drawingEngine": {
            "name": "HarukiBot NEO Drawing Engine",
            "desc": "The image rendering service of HarukiBot NEO: takes JSON requests and returns images of player profiles, cards, events, songs, charts and more. The service runs on free-threaded Python 3.14 with FastAPI; drawing is done by a native Rust and Skia renderer."
          },
          "botBackend": {
            "name": "HarukiBot NEO Backend",
            "desc": "The core backend of HarukiBot NEO: parses bot commands, looks up Project Sekai and CHUNITHM data to build replies, and handles bot registration and authentication. Built with Go, Fiber and Ent."
          },
          "toolboxBackend": {
            "name": "Haruki Toolbox Backend",
            "desc": "The Haruki Toolbox backend: receives players' uploaded Suite and MySekai data and serves query APIs, with sign-in and third-party authorization handled by Ory Kratos and Hydra. Built with Go, Fiber and Ent on PostgreSQL and Redis."
          },
          "deckService": {
            "name": "Deck Service",
            "desc": "The deck recommendation HTTP service: a Rust and Axum API that calls the C++ deck engine through FFI and can be statically linked into a single binary."
          },
          "deckCpp": {
            "name": "Sekai Deck Recommend CPP",
            "desc": "The C++ engine for deck recommendation and score calculation: brute-force search plus randomized and heuristic algorithms, published as Python and WebAssembly packages. The original implementation comes from NeuraXmy, with some modifications from moe-sekai."
          },
          "scoresRs": {
            "name": "PJSekai Scores RS",
            "desc": "A Project Sekai chart parser and renderer: reads .sus charts, generates SVG chart images, and renders PNG or JPEG directly with a pure-Rust renderer. Available as a Rust crate, a command-line tool and a Python package."
          },
          "toolbox": {
            "name": "Haruki Toolbox",
            "desc": "The Haruki Toolbox web app: game catalog, event ranking calculators and personal data tools. Built with Vue 3 and TypeScript, with a Shadcn-Vue and Tailwind CSS interface."
          },
          "assetUpdater": {
            "name": "Haruki Sekai Asset Updater",
            "desc": "Keeps Project Sekai game assets up to date: downloads and decrypts asset bundles, exports images, audio and video, and uploads them to object storage. Built with Rust, unpacking with unity-rs and cridecoder."
          },
          "sekaiApi": {
            "name": "Haruki Sekai API",
            "desc": "An API proxy for the Project Sekai game servers of all five regions: manages each region's game accounts, handles the encrypted protocol, and keeps master data updated and distributed. Built with Rust and Axum."
          },
          "eventTracker": {
            "name": "Haruki Event Tracker",
            "desc": "Tracks Project Sekai event rankings: records each region's leaderboard data on a schedule and serves ranking query APIs plus real-time WebSocket updates. Built with Rust and Axum."
          },
          "cridecoder": {
            "name": "Cridecoder",
            "desc": "A pure-Rust codec library for CRI Middleware: extracts and builds ACB and AWB audio containers and USM video containers, encodes and decodes HCA audio, and ships Python bindings."
          },
          "unityRs": {
            "name": "Unity RS",
            "desc": "A headless Unity asset reader and exporter: parses asset bundles and exports textures, audio and models (OBJ, FBX). Available as a Rust library, a command-line tool, and Python and Node.js bindings; built on the format research of AssetStudio and AssetStudioMod."
          }
        }
      },
      "support": {
        "title": "Support Haruki",
        "desc": "The development and maintenance of Project Haruki related projects require a significant amount of manpower, financial resources, and energy from the Haruki Dev Team. To help us do better, your support is highly appreciated!",
        "afdianBtn": "Sponsor us (Afdian)",
        "sponsorsBtn": "Sponsors List"
      }
    }
  },
  "sponsor": {
    "hero": {
      "badge": "Afdian sponsors",
      "title": "Support Project Haruki",
      "description": "Every sponsorship helps keep HarukiBot NEO, Haruki Toolbox, and the shared service infrastructure running for the community.",
      "cta": "Sponsor on Afdian",
      "aboutCta": "About Project Haruki"
    },
    "summary": {
      "supporters": "Supporters",
      "current": "Current",
      "former": "Past",
      "updatedAt": "Updated {time}"
    },
    "sections": {
      "planCount": "{count}",
      "current": {
        "title": "Current sponsors",
        "empty": "No one is sponsoring right now."
      },
      "former": {
        "title": "Past sponsors",
        "empty": "No sponsors whose time has run out yet."
      }
    },
    "supporter": {
      "anonymous": "Anonymous supporter",
      "defaultPlan": "Afdian support",
      "pastPlan": "Past support",
      "active": "Currently supporting",
      "activeUntil": "Active until {date}",
      "expiredAt": "Expired on {date}",
      "recent": "Recent support",
      "supportCount": "sponsored {count} times"
    },
    "empty": {
      "title": "No sponsor data yet",
      "description": "Once the backend publishes sponsor records, the list will appear here.",
      "unavailableTitle": "Sponsor list unavailable",
      "unavailableDescription": "The sponsor list cannot be loaded right now. Please check back later."
    }
  },
  "legal": {
    "common": {
      "eyebrow": "Legal",
      "toc": "On this page"
    },
    "privacy": {
      "title": "Privacy Policy",
      "lastUpdated": "Last updated: 2026-10-30",
      "intro": "This Privacy Policy explains how Haruki Toolbox collects, uses, stores, shares, and protects your information. Haruki Dev Team is a fan-run volunteer development and maintenance group, and we aim to handle data in a clear, limited, and necessary way.",
      "contactLead": "For privacy questions, contact: ",
      "sections": {
        "controller": {
          "title": "1. Service provider and scope",
          "paragraphs": {
            "summary": "Haruki Toolbox is maintained by Haruki Dev Team. The service is primarily intended for users in mainland China, while also allowing users worldwide to access and use it. This policy applies to the Haruki Toolbox website and related features."
          },
          "bullets": {
            "team": "Service provider: Haruki Dev Team. We are not a registered company; we are a fan-run volunteer development and maintenance group.",
            "contact": "Contact email: see the address shown above.",
            "region": "Data is primarily stored in mainland China. We also use CDN services to improve access performance and availability.",
            "minors": "The service currently has no age restriction. Minors should use the service with the knowledge and guidance of a guardian."
          }
        },
        "collection": {
          "title": "2. Information we collect",
          "paragraphs": {
            "summary": "To provide accounts, bindings, uploads, deck recommendation, score control, tickets, and security controls, we collect information you provide, information generated while using the service, and technical information needed for service operation."
          },
          "bullets": {
            "account": "Account and authentication information, such as email address, username, avatar, OAuth or third-party login identifiers, MFA status, login sessions, IP address, User-Agent, and other required authentication data.",
            "game": "Game account and uploaded data, such as region, game UID, player nickname, suite data, MySekai data, upload time, cached data, and settings related to bound game accounts.",
            "profile": "User profile data may be used for display and feature calculation, but it is not stored on Haruki Toolbox servers.",
            "logs": "Operation and security logs, such as access logs, error logs, upload logs, risk-control logs, admin operation logs, and required API call records.",
            "storage": "Local data. We use cookies, localStorage, IndexedDB, and PWA cache to store login state, settings, cached data, and offline resources. These storage mechanisms are required for the current service and cannot be disabled."
          }
        },
        "usage": {
          "title": "3. How we use information",
          "paragraphs": {
            "summary": "We use your information only as needed to provide and maintain Haruki Toolbox and advanced HarukiBot NEO features."
          },
          "bullets": {
            "service": "To provide account login, game account binding, data upload, deck recommendation, score control, ticket handling, and preference synchronization.",
            "security": "To perform authentication, account protection, API rate limiting, abuse detection, risk-control auditing, and incident investigation.",
            "support": "To diagnose issues, respond to feedback, handle tickets, improve product experience, and maintain service stability.",
            "advanced": "To provide advanced features in Haruki Toolbox and HarukiBot NEO based on data you upload or authorize.",
            "compliance": "To process information where required by law, regulation, or the safety of users and the service."
          }
        },
        "retention": {
          "title": "4. Data retention",
          "paragraphs": {
            "summary": "Unless we actively clean up data, change service policy, or are required by law, server-side data may be retained long term to maintain account bindings, upload history, risk-control auditing, and service continuity."
          },
          "bullets": {
            "server": "Server-side data, including game account bindings, upload records, account data (Suite), MySekai data, logs, and admin operation records, currently has no fixed retention period, except the transfer-code vault (see section 5).",
            "local": "Logging out clears some local cached user data in your browser, but it does not automatically delete data already stored on the server.",
            "requests": "Deletion, export, and account closure are not currently self-service. Please contact Haruki Dev Team by email if you need these actions."
          }
        },
        "inheritVault": {
          "title": "5. Transfer-code vault",
          "paragraphs": {
            "summary": "When you upload data with a transfer code, the toolbox executes the transfer only after you confirm. After that, the device that generated the code can no longer sign in to the game account, so we issue you a new transfer code and keep the account credential and the new code encrypted in your transfer vault, so that you can get back into your account."
          },
          "bullets": {
            "stored": "What is stored: the game account's login credential, the transfer code newly issued for it (transfer ID and password), the region, the game UID, and creation and expiry times. The code you entered is only used while the job runs and is discarded after the transfer; it is not stored.",
            "purpose": "Why: only so that you can view the new code, or, if it is lost or no longer valid, have a new one issued from the stored credential and move the account back to your device. It is not used for anything else.",
            "encryption": "Encryption: the credential and the code are encrypted with a key derived from your Toolbox password (or, for accounts without a password, the vault PIN you set), and then with a server key. The database, the server key or your password alone cannot open them.",
            "retention": "Retention: the code is deleted 24 hours after it was issued and the credential after at most 7 days; when you choose “I recovered it on my phone” the record becomes unreadable at once and is deleted within minutes; resetting the vault deletes every record.",
            "access": "Who can read it: only you, after entering your Toolbox password or vault PIN; Haruki Dev Team admins and operators cannot. The one exception: while an upload job runs (at most 1 hour), the server keeps a copy of the newest code under the server key alone so it can show it to you on the page, and deletes it when the job record expires; the credential is never kept that way.",
            "audit": "Audit and notices: creating, confirming and cancelling jobs, storing credentials, viewing, re-issuing and destroying records, and creating, re-wrapping and resetting vault keys are recorded in the system log (without codes, passwords or full game UIDs); viewing or re-issuing a code sends a notice to your verified email address.",
            "delete": "How to delete: you can destroy a single record, or reset the whole vault, at any time in the vault on the Upload data → Transfer code page. If you reset your Toolbox password through account recovery, the old records can no longer be opened and the only option is resetting the vault.",
            "local": "Local data: the browser only remembers which transfer is in progress (at most 1 hour), never the transfer code or any password. The former “remember transfer info on this device” option has been removed, and transfer info it saved in your browser is cleared automatically."
          }
        },
        "sharing": {
          "title": "6. Sharing and third-party services",
          "paragraphs": {
            "summary": "We do not sell your personal information or use it for advertising profiles. We do not disclose your information to unrelated third parties except where necessary to provide the service, where you authorize it, or where required by law."
          },
          "bullets": {
            "noSale": "We do not sell, rent, or share your personal information for advertising profiling.",
            "harukiServices": "Uploaded or bound data is used by default only to provide advanced features in Haruki Toolbox and HarukiBot NEO. Third-party services cannot access this data unless you enable public API queries or grant OAuth authorization yourself.",
            "google": "If you sign in with Google, Google processes the relevant third-party login information under its own policies.",
            "cdn": "We use Cloudflare, EdgeOne, and CDN services to distribute static assets and improve performance and availability.",
            "email": "We use email services to send account, security, and service-related emails. Ory Kratos/Hydra is self-hosted for authentication and authorization."
          }
        },
        "security": {
          "title": "7. Data security",
          "paragraphs": {
            "summary": "We take reasonable technical and administrative measures to protect data, but no internet service can guarantee absolute security."
          },
          "bullets": {
            "controls": "We use encrypted transport, access control, permission isolation, log auditing, and least-privilege practices to reduce risks of leakage, misuse, or unauthorized access.",
            "limits": "Because this project is maintained by a volunteer fan team, our resources and security capacity have practical limits. If you discover a security issue, please report it responsibly by email."
          }
        },
        "rights": {
          "title": "8. Your rights",
          "paragraphs": {
            "summary": "Where permitted by applicable law, you may request access, correction, export, deletion of certain personal information, or account closure."
          },
          "bullets": {
            "settings": "You can manage some account information, binding information, and preferences in account settings or related feature pages.",
            "contact": "To request deletion, export, or account closure, contact Haruki Dev Team through the email address shown above.",
            "limits": "For security, auditing, dispute handling, service continuity, or legal compliance, we may be unable to immediately or fully delete certain logs, backups, or required records."
          }
        },
        "changes": {
          "title": "9. Policy updates",
          "paragraphs": {
            "summary": "We may update this Privacy Policy as features, services, or compliance needs change. The updated policy will be posted on this page and becomes effective when published."
          },
          "bullets": {}
        },
        "contact": {
          "title": "10. Contact",
          "paragraphs": {
            "summary": "If you have questions about this policy, personal information processing, or account data, contact Haruki Dev Team through the email address shown above."
          },
          "bullets": {}
        }
      }
    },
    "tos": {
      "title": "Terms of Service",
      "lastUpdated": "Last updated: 2026-10-30",
      "intro": "By using Haruki Toolbox, you agree to these terms. If you do not agree, please stop using the service.",
      "contactLead": "For questions about these terms, contact: ",
      "sections": {
        "scope": {
          "title": "1. Scope",
          "paragraphs": {
            "summary": "These terms apply to your access to and use of the Haruki Toolbox website, pages, tools, account system, data upload, deck recommendation, score control, tickets, and related features."
          },
          "bullets": {
            "team": "Haruki Toolbox is provided by Haruki Dev Team, a fan-run volunteer development and maintenance group.",
            "unofficial": "Haruki Toolbox is a fan-made and unofficial project. It is not affiliated with, authorized by, endorsed by, or officially partnered with SEGA, Colorful Palette, or related rights holders.",
            "global": "The service is primarily intended for users in mainland China while also allowing global use. You are responsible for ensuring your use complies with applicable local laws."
          }
        },
        "account": {
          "title": "2. Account responsibility",
          "paragraphs": {
            "summary": "You are responsible for safeguarding your account, password, MFA, OAuth authorization, game transfer code, and other credentials, and for activities under your account."
          },
          "bullets": {
            "credentials": "If you notice account abnormality, credential leakage, or unauthorized use, update your password, revoke authorization, and contact us promptly.",
            "dataAccuracy": "You should ensure that submitted, bound, or uploaded data comes from accounts you are authorized to use and is as accurate and complete as possible.",
            "adminSupport": "To handle feedback, tickets, risk control, security, or service support, admins may review user data, upload records, logs, and ticket content related to the issue; the account credentials and transfer codes kept encrypted in the transfer-code vault are excluded, and admins cannot read them."
          }
        },
        "acceptableUse": {
          "title": "3. Acceptable use",
          "paragraphs": {
            "summary": "You must use the service in a reasonable, lawful, and good-faith manner, without disrupting the service or harming other users, maintainers, or third parties."
          },
          "bullets": {
            "lawful": "You must not use the service for illegal, infringing, fraudulent, abusive, restriction-bypassing, or otherwise improper activities.",
            "automation": "Without explicit permission, any form of automated access, crawling, bulk requests, bulk registration, bulk upload, or API abuse is prohibited.",
            "security": "You must not scan, attack, disrupt, bypass authentication, bypass risk controls, reverse engineer API restrictions, or access unauthorized data.",
            "rateLimit": "We may rate limit, reject service, ban accounts, or block access for abnormal requests, bulk requests, or abusive behavior."
          }
        },
        "dataUse": {
          "title": "4. User data and authorization",
          "paragraphs": {
            "summary": "Data you upload, bind, or authorize is used by default only to provide advanced features in Haruki Toolbox and HarukiBot NEO."
          },
          "bullets": {
            "harukiServices": "Third-party services cannot access your bound or uploaded Haruki Toolbox data unless you enable public API queries or grant OAuth authorization yourself.",
            "thirdParty": "Data generated through third-party login, CDN, or email services may also be subject to those providers' terms and privacy policies.",
            "oauth": "If you authorize another application to access your account or data, you are responsible for reviewing the authorization scope and trustworthiness of that third party."
          }
        },
        "betaFeatures": {
          "title": "5. Beta features and result accuracy",
          "paragraphs": {
            "summary": "Some features are still in testing and may contain calculation errors, data delays, API changes, or unexpected results."
          },
          "bullets": {
            "deckRecommend": "Deck recommendation is currently a beta feature. Results are not guaranteed to be optimal or fully consistent with in-game behavior.",
            "scoreControl": "Score control calculation is currently a beta feature. Results are not guaranteed to be accurate; please verify live boost count, event settings, and in-game data before use.",
            "noGuarantee": "You are responsible for judging and accepting the risks of actions based on recommendation, calculation, or display results."
          }
        },
        "gameAccountRisk": {
          "title": "6. Game account and transfer-code risks",
          "paragraphs": {
            "summary": "Haruki Toolbox may provide helper features related to game data updates, uploads, or transfer codes. You should understand that these operations may involve account security and game terms-of-service risks."
          },
          "bullets": {
            "transferCode": "You are responsible for risks arising from using transfer codes to update data, synchronize data, or related operations, including game account bans, restrictions, abnormalities, or other consequences.",
            "accountLoss": "We are not responsible for loss of a game account caused by your failure to properly save transfer codes, passwords, login credentials, or other account recovery information."
          }
        },
        "availability": {
          "title": "7. Availability and changes",
          "paragraphs": {
            "summary": "We try to maintain service availability, but we do not promise that the service will be continuous, error-free, uninterrupted, or that any feature will be permanently retained."
          },
          "bullets": {
            "changes": "We may modify, suspend, limit, or discontinue features due to maintenance, security, abuse prevention, cost, product changes, or third-party changes.",
            "thirdParty": "Third-party login, CDN, email, network conditions, game data sources, or other external service issues may affect Haruki Toolbox availability."
          }
        },
        "enforcement": {
          "title": "8. Enforcement",
          "paragraphs": {
            "summary": "If you violate these terms or act in a way that harms the service, security, other users, or project maintainers, we may take necessary measures."
          },
          "bullets": {
            "ban": "Measures may include feature restrictions, rate limiting, request blocking, account suspension, account bans, or refusal to continue providing service.",
            "data": "To investigate violations, handle disputes, protect security, or support required auditing, we may retain related logs and records."
          }
        },
        "links": {
          "title": "9. Third-party links and open source projects",
          "paragraphs": {
            "summary": "Haruki Toolbox may include links to third-party websites, open-source repositories, documentation, or community resources."
          },
          "bullets": {
            "external": "Third-party websites and services are operated by their respective providers. We do not control their content, availability, security, or privacy practices.",
            "openSource": "Code, dependencies, and license information for open-source projects are governed by the corresponding repositories, license files, and project documentation."
          }
        },
        "liability": {
          "title": "10. Limitation of liability",
          "paragraphs": {
            "summary": "To the extent permitted by law, Haruki Dev Team is not liable for direct or indirect losses caused by your use of or inability to use the service, reliance on calculation or recommendation results, third-party service failures, network issues, force majeure, or factors outside our control."
          },
          "bullets": {
            "scope": "The service is provided as is and does not guarantee game results, account safety, data integrity, service continuity, or fitness for any particular purpose."
          }
        },
        "changes": {
          "title": "11. Terms updates",
          "paragraphs": {
            "summary": "We may revise these terms from time to time. The updated terms will be posted on this page and become effective when published. Continued use after updates means you accept the revised terms."
          },
          "bullets": {}
        },
        "contact": {
          "title": "12. Contact and dispute handling",
          "paragraphs": {
            "summary": "If you have questions, feedback, or disputes about these terms or the service, contact Haruki Dev Team through the email address shown above. We prefer to resolve issues through friendly communication."
          },
          "bullets": {}
        }
      }
    }
  }
} as const
