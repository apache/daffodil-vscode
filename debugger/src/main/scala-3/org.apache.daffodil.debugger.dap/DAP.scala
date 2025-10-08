package org.apache.daffodil.debugger

/** The dap package object allows other files inside of the package to be able to use specific classes and types without
  * directly importing them. This help us with the different versions of Daffodil where the classes have the same name
  * but have moved to different import paths.
  */

package object dap {
  type Debugger = org.apache.daffodil.api.debugger.Debugger
  type Diagnostic = org.apache.daffodil.api.Diagnostic
  type SDiagnostic = org.apache.daffodil.api.Diagnostic
  type JsonInfosetOutputter = org.apache.daffodil.runtime1.infoset.JsonInfosetOutputter
  type XMLTextInfosetOutputter = org.apache.daffodil.runtime1.infoset.XMLTextInfosetOutputter
  type DataProcessor = org.apache.daffodil.api.DataProcessor
}
