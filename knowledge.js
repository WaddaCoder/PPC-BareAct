/* ==========================================================
   ATLAS KNOWLEDGE BASE
   Version 1.0
   Pakistan Penal Code
========================================================== */

const Atlas = {

    corpus: {
        id: "ppc",
        title: "Pakistan Penal Code",
        edition: "Atlas",
        motto: "Read Less. Understand More."
    },

    home: [

        {
            id: "patterns",
            icon: "🧠",
            title: "Patterns",
            description:
                "Discover the hidden logical structures used throughout the Penal Code.",
            badge: "40+ Patterns"
        },

        {
            id: "concepts",
            icon: "💡",
            title: "Concepts",
            description:
                "Understand the legal ideas that silently power hundreds of sections.",
            badge: "Core Vocabulary"
        },

        {
            id: "cases",
            icon: "⚖",
            title: "Landmark Cases",
            description:
                "Verified judicial precedents that shaped criminal law.",
            badge: "Verified Only"
        },

        {
            id: "connections",
            icon: "🕸",
            title: "Connections",
            description:
                "See how provisions depend upon and build upon one another.",
            badge: "Knowledge Graph"
        },

        {
            id: "journeys",
            icon: "🧭",
            title: "Learning Journeys",
            description:
                "Study the Code through guided conceptual pathways.",
            badge: "Visual Learning"
        },

        {
            id: "myatlas",
            icon: "⭐",
            title: "My Atlas",
            description:
                "Bookmarks, revision, thinking questions and progress.",
            badge: "Personal"
        }

    ],

    patterns: [

        {
            id: "conjunction",

            title: "Conjunction",

            difficulty: 2,

            definition:
                "Multiple legal elements must all exist before liability arises.",

            architect:
                "Conjunction is one of the principal drafting techniques used to combine several legal requirements into one offence.",

            structural:
                "Removing one required element usually prevents the offence from being established.",

            exam:
                "Always identify every required ingredient before concluding that an offence exists.",

            sections: [
                378,
                390,
                420
            ],

            question:
                "Why is proving only one ingredient of an offence usually insufficient?"
        },

        {
            id: "dependency",

            title: "Dependency",

            difficulty: 3,

            definition:
                "One provision cannot be fully understood without another provision.",

            architect:
                "Dependencies create the internal architecture of the Code.",

            structural:
                "
