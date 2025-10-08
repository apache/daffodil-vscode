package org.apache.daffodil.debugger

/** The dap package object allows other files inside of the package to be able to use specific classes and types without
  * directly importing them. This help us with the different versions of Daffodil where the classes have the same name
  * but have moved to different import paths.
  */

package object dap {
  type Debugger = org.apache.daffodil.runtime1.debugger.Debugger
  type Diagnostic = org.apache.daffodil.lib.api.Diagnostic
  type SDiagnostic = org.apache.daffodil.sapi.Diagnostic
  type JsonInfosetOutputter = org.apache.daffodil.sapi.infoset.JsonInfosetOutputter
  type XMLTextInfosetOutputter = org.apache.daffodil.sapi.infoset.XMLTextInfosetOutputter
  type DataProcessor = org.apache.daffodil.sapi.DataProcessor
}
