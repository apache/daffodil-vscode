/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Language services module for DFDL (Data Format Description Language) and TDML (Test Data Markup Language).
 *
 * This module serves as the main entry point for language support features including:
 * - Language server initialization and management
 * - Semantic tokenization and syntax highlighting
 * - Completion providers for elements, attributes, and XPath expressions
 * - Hover providers for documentation
 * - Diagnostics and validation
 */

// Export DFDL language services including lexer, providers, and language server setup
export * as dfdl from './dfdl'

// Export TDML language services for test data markup language support
export * as tdml from './tdml'
